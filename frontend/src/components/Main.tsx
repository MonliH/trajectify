import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import Future from "./Future";

export default function Home() {
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const [profile, setProfile] = useState(null as any);
  const [isError, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [predictions, setPredictions] = useState([] as any[]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input === "") {
      return;
    }
    (async () => {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/get_profile?username=${input}`
      );
      const data = await res.json();

      if (Object.keys(data).length > 0) {
        setError(false);
        setProfile(data);

        setIsPredictionLoading(true);
        const prediction = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/predict_experience`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        );
        const predictionData = await prediction.json();
        setIsPredictionLoading(false);
        setPredictions([predictionData]);
      } else {
        setError(true);
      }
      setIsLoading(false);
    })();
  };

  return (
    <VStack>
      <VStack w="40%" h="full">
        <Image src="/logoSVG.svg" w="40%" h="40%" mt="10" />
        <Text mb="18" fontSize="xl">
          Accelerate your career trajectory.
        </Text>
        <form onSubmit={onSubmit} style={{ width: "100%" }}>
          <FormControl isInvalid={isError} w="100%">
            <HStack>
              <Input
                type="username"
                value={input}
                onChange={handleInputChange}
                placeholder="LinkedIn username"
              />
              <Button
                colorScheme="red"
                type="submit"
                ml="1"
                isLoading={isLoading}
              >
                Trajectify!
              </Button>
            </HStack>
            {isError && (
              <Text color="red">LinkedIn user could not be found.</Text>
            )}
          </FormControl>
        </form>

        {profile && (
          <Box w="100%" borderColor="gray.300" borderWidth="1">
            <HStack mb="4">
              <Image
                src={profile.displayPictureUrl + profile.img_100_100}
                borderRadius="50%"
              ></Image>
              <Box ml="2">
                <Heading fontSize="3xl">
                  {profile.firstName} {profile.lastName}
                </Heading>
                <Text>{profile.headline}</Text>
              </Box>
            </HStack>
            <Box>
              <Skeleton isLoaded={predictions.length > 0}>
                <Box
                  my="6"
                  ml="-4"
                  px="4"
                  width="calc(100% + 1rem)"
                  pb="3"
                  pt="6"
                  borderWidth="2px"
                  borderColor="yellow.300"
                  borderRadius="lg"
                  boxShadow="0px 4px 21px rgba(255, 241, 116, 0.25)"
                >
                  <Text
                    position="absolute"
                    mt="-9"
                    backgroundColor="white"
                    px="2"
                    color="black"
                    fontWeight="bold"
                  >
                    What your future could hold...
                  </Text>
                  <Future prediction={predictions[0]} profile={profile}/>
                </Box>
              </Skeleton>
            </Box>
            <Box mb="4">
              <Heading fontSize="xl">Summary</Heading>
              <Text>{profile.summary}</Text>
            </Box>
            <Box>
              <Heading fontSize="xl">Experience</Heading>

              {profile.experience.map((exp: any, i: number) => (
                <Fragment key={i}>
                  {i !== 0 && <Divider my="3" />}
                  <HStack alignItems={"flex-start"}>
                    {exp.companyLogoUrl && exp.img_100_100 ? (
                      <Image
                        src={exp.companyLogoUrl + exp.img_100_100}
                        w="48px"
                        h="48px"
                      ></Image>
                    ) : (
                      <Image
                        src="https://static.licdn.com/sc/h/aajlclc14rr2scznz5qm2rj9u"
                        w="48px"
                        h="48px"
                      ></Image>
                    )}
                    <Box>
                      <Text fontWeight="extrabold" fontSize="lg">
                        {exp.title}
                      </Text>
                      <Text fontSize="lg">{exp.companyName}</Text>
                      <Text color="#999999">{exp.locationName}</Text>
                      <Text whiteSpace={"pre-line"}>{exp.description}</Text>
                    </Box>
                  </HStack>
                </Fragment>
              ))}
            </Box>
          </Box>
        )}
      </VStack>
    </VStack>
  );
}
