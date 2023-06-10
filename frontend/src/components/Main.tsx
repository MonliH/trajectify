import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const [profile, setProfile] = useState({} as any);
  const [isError, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      } else {
        setError(true);
      }
      setIsLoading(false);
    })();
  };

  console.log(profile);

  return (
    <VStack w="full" h="full">
      <Heading mb="3" fontSize={"7xl"}>
        Trajectify
      </Heading>
      <form onSubmit={onSubmit}>
        <FormControl isInvalid={isError} w="50vw">
          <HStack>
            <Input
              type="username"
              value={input}
              onChange={handleInputChange}
              placeholder="LinkedIn username"
            />
            <Button
              colorScheme="blue"
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

      <Box w="70%" borderColor="gray.300" borderWidth="1">
        <HStack>
          <Image
            src={profile.displayPictureUrl + profile.img_100_100}
            borderRadius="50%"
          ></Image>
          <Box>
            <Heading fontSize="xl">
              {profile.firstName} {profile.lastName}
            </Heading>
            <Text>{profile.headline}</Text>
          </Box>
        </HStack>
        <Box>
          <Heading fontSize="xl">Summary</Heading>
          <Text>{profile.summary}</Text>
        </Box>
        <Box>
          <Heading fontSize="xl">Experience</Heading>
        <Box>
        </Box>
        {profile.experience.map((exp: any) => (
            <Box>
                <Heading fontSize="lg">{exp.title}</Heading>
                <Text>{exp.companyName}</Text>
                <Text>{exp.locationName}</Text>
                <Text>{exp.dateRange}</Text>
                <Text whiteSpace={"pre-line"}>{exp.description}</Text>
            </Box>
            )
        )}
        </Box>
      </Box>
    </VStack>
  );
}
