from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache
import openai
import asyncio
import re


from monkeypatched_linkedin import Linkedin
import dotenv
import os

dotenv.load_dotenv(".env")

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = Linkedin(os.getenv("OUTLOOK_EMAIL"), os.getenv("OUTLOOK_PASSWORD"))

@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

@app.get("/get_profile")
@cache(expire=600)
async def get_profile(username: str):
    matches = re.findall(r"www\.linkedin\..*/in/([A-Za-z0-9_-]+)", username)
    if len(matches) != 0:
        profile = api.get_profile(matches[0])
    else:
        profile = api.get_profile(username)
    return profile

def format_profile(profile):
    if not profile: return None
    headline = profile["headline"].strip() if "headline" in profile and profile["headline"] else "Not listed"
    industryName = profile["industryName"].strip() if "industryName" in profile and profile["industryName"] else "Not listed"
    name = profile["firstName"] + " " + profile["lastName"]
    country = profile["locationName"].strip() if "locationName" in profile and profile["locationName"] else "Not listed"
    summary = profile["summary"].strip() if "summary" in profile and profile["summary"] else "Not listed"
    experience = profile["experience"] if "experience" in profile and profile["experience"] else None
    volunteering = profile["volunteer"] if "volunteer" in profile and profile["volunteer"] else None
    education = profile["education"] if "education" in profile and profile["education"] else None
    awards = profile["honors"] if "honors" in profile else None

    def formatList(l, keys):
        res = ""
        for item_num, item in enumerate(l):
            for i, key in enumerate(keys.keys()):
                if (key not in item or not item[key]): continue
                # res += "" if i != 0 else ""
                res += keys[key] + ": " + item[key].strip() + ("\n" if i != len(keys) - 1 else "")
            if item_num != len(l) - 1:
                res += "\n"
        return res
    
    def formatExperience(experience, keys):
        res = []
        for item in experience:
            temp = ""
            for i, key in enumerate(keys.keys()):
                if (key not in item or not item[key]): continue
                # res += "" if i != 0 else ""
                temp += keys[key] + ": " + item[key].strip() + "\n"
            time_period_valid = item['timePeriod'] and 'startDate' in item['timePeriod'] and item['timePeriod']['startDate']
            month_valid = time_period_valid and 'month' in item['timePeriod']['startDate'] and item['timePeriod']['startDate']['month']
            year_valid = time_period_valid and 'year' in item['timePeriod']['startDate'] and item['timePeriod']['startDate']['year']
            date_str = f"{item['timePeriod']['startDate']['month']:0>2}/{item['timePeriod']['startDate']['year']}"if time_period_valid and month_valid and year_valid else "Not listed"
            temp += f"Starting Date: " + date_str
            res.append((temp,
                        int(item['timePeriod']['startDate']['year']) if time_period_valid and year_valid else None,
                        int(item['timePeriod']['startDate']['month']) if time_period_valid and month_valid else None))
        
        return list(reversed(res))


    formatted_education = formatList(education, { 'schoolName': 'School name', 'description': 'Description' }) if education else "Not listed"
    formatted_volunteering = formatList(volunteering, { 'companyName': 'Company name', 'role': 'Role', 'description': 'Description' }) if volunteering else "Not listed"
    formatted_awards = formatList(awards, { 'title': 'Title', 'issuer': 'Issuer', 'description': "Description" }) if awards else "Not listed"
    formatted_experience = formatExperience(experience, { 'companyName': 'Company name', 'title': 'Title', 'description': 'Description' }) if experience else []

    formatting_string = """Name: {name}

Industry: {industryName}
Country: {country}
Headline: {headline}
Summary: {summary}
---
Volunteering:
{formatted_volunteering}
---
Honors & Awards:
{formatted_awards}
---
Education:
{formatted_education}
"""
    return (formatting_string.format(name=name, country=country, industryName=industryName,
                                    headline=headline, summary=summary, 
                                    formatted_volunteering=formatted_volunteering, 
                                    formatted_education=formatted_education, formatted_awards=formatted_awards), formatted_experience)

def parse_model_output(output: str):
    """
    Looks like
    Company name: Queen's University
    Title: Machine Learning Research Associate
    Description: - Published paper as first author to the 2023 Association of Computational Linguistics (ACL) conference, "Prefix-Propagation: Parameter-Efficient Tuning for Long Sequences"
    - Published paper as first author to the Natural Legal Language Processing workshop co-located at EMNLP 2022, "Parameter-Efficient Legal Domain Adaptation"
    - Researching natural language processing with interests in parameter-efficient tuning, long document modelling, and foundation models, under the supervision of Dr. Xiaodan Zhu
    Starting Date: 06/2022
    """
    lines = output.split("\n")
    company_name = ": ".join(lines[0].split(": ")[1:])
    title = ": ".join(lines[1].split(": ")[1:])
    description_segments = "\n".join(lines[2:-1]).split(": ")
    description = ": ".join(description_segments[1:])
    starting_month, starting_year = lines[-1].split(": ")[1].split("/")
    return {"companyName": company_name, "title": title, "description": description, "timePeriod": {"startDate": {"month": int(starting_month), "year": int(starting_year)}}}


@app.post("/predict_experience")
async def predict_experience(req: Request):
    profile = await req.json()
    text, experiences = format_profile(profile)
    text += "---\nExperience:\n" + "\n\n".join(e[0] for e in experiences)
    print(text)
    instruction = "Predict what the person's next prestigious experience on LinkedIn is going to be."
    prompt = "Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.\n\n### Instruction:\n{instruction}\n\n### Input:\n{input}\n\n### Response:"
    filled_text = prompt.format(instruction=instruction, input=text)

    # query model here

    model_output = """Company name: Queen's University
Title: Machine Learning Research Associate
Description: - Published paper as first author to the 2023 Association of Computational Linguistics (ACL) conference, "Prefix-Propagation: Parameter-Efficient Tuning for Long Sequences"
- Published paper as first author to the Natural Legal Language Processing workshop co-located at EMNLP 2022, "Parameter-Efficient Legal Domain Adaptation"
- Researching natural language processing with interests in parameter-efficient tuning, long document modelling, and foundation models, under the supervision of Dr. Xiaodan Zhu
Starting Date: 06/2022"""

    await asyncio.sleep(3)

    return parse_model_output(model_output)

openai.organization = os.environ["OPENAI_ORG"]
openai.api_key = os.environ["OPENAI_API_KEY"]
MODEL = "gpt-3.5-turbo"

@app.post("/predict_next_steps")
async def predict_next_steps(req: Request):
    profile = await req.json()
    text, experiences = format_profile(profile)
    text += "---\nExperience:\n" + "\n\n".join(e[0] for e in experiences[:-1])
    text += "\n\nWhat goals should I set to have this following entry on my LinkedIn profile?\n" + experiences[-1][0]

    response = openai.ChatCompletion.create(
        model=MODEL,
        messages=[{"role": "system", "content":"""Given is the LinkedIn profile of a user. You are to list achievable goals that the user can make to be able to have the position that they say they want.

Try to consider the user's previous experiences and expertise while creating these goals. They should be achievable and specific. Do not make the goals too specific for the position itself.

List the goals in point form (starting with "-"). You must only provide the goals and no additional comments."""},
{"role": "user", "content": text}],
        max_tokens=512,
        temperature=0.3,
    )

    r = response["choices"][0]["message"]["content"]
    return {"nextSteps": [point.replace("- ", "") for point in r.split("\n")]}
