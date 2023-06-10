from linkedin_api import Linkedin
import os
import json
import openai
import dotenv

dotenv.load_dotenv(".env")

api = Linkedin(os.getenv("OUTLOOK_EMAIL"), os.getenv("OUTLOOK_PASSWORD"))
profile = api.get_profile("jonatli")


import re
a = open("../linkedin.html", "r")
# final all linkedin users, in the fore https://www.linkedin.com/in/{username}
matches = re.findall(r"https://www.linkedin.com/in/([A-Za-z0-9_-]+)", a.read())
users = set(matches)


import jsonlines
from tqdm import tqdm

with jsonlines.open('output.jsonl', mode='w') as writer:
    all_users = list(users)
    for profile_username in tqdm(all_users):
        profile = api.get_profile(profile_username)
        writer.write(profile)
