import {
  Box,
  Button,
  Checkbox,
  HStack,
  Heading,
  Image,
  ListItem,
  OrderedList,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "react-feather";
import debounce from "lodash.debounce";

export default function Future({ prediction, profile }: { prediction: any, profile: any }) {
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [pressedBefore, setPressedBefore] = useState(false);
  const [steps, setSteps] = useState([]);
  const [firstParagraph, setFirstParagraph] = useState("");

  useEffect(() => {
    setPressedBefore(false);
    setSteps([]);
    setFirstParagraph("");
    setShowNextSteps(false);
  }, [profile.public_id]);

  useEffect(() => {
    if (prediction && !pressedBefore) {
      setPressedBefore(true);
      debouncedLoadData();
    }
  }, [prediction?.companyName, prediction?.title, prediction?.description]);

  const loadData = () => {
    (async () => {
        const newProfile = JSON.parse(JSON.stringify(profile));
        newProfile.experience.unshift(prediction);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict_next_steps`, {
            method: "POST",
            body: JSON.stringify(newProfile),
            headers: new Headers({
              "ngrok-skip-browser-warning": "true"
            })
        });

        const response = await res.json();
        setSteps(response.nextSteps);
        setFirstParagraph(response.firstParagraph);
    })();
  };

  const debouncedLoadData = debounce(loadData, 500);

  return (
    <HStack alignItems={"flex-start"}>
      <Image
        src="https://static.licdn.com/sc/h/aajlclc14rr2scznz5qm2rj9u"
        w="48px"
        h="48px"
      ></Image>
      <Box>
        <Heading fontSize="lg">{prediction?.companyName ?? "Dummy"}</Heading>
        <Text>{prediction?.title ?? "Dummy"}</Text>
        {/* <Text>{predictions[0]?.locationName ?? "Dummy"}</Text> */}
        <Text whiteSpace={"pre-line"}>
          {prediction?.description.trim() ?? "Dummy"}
        </Text>
        <Button
            mt="4"
            mb="2"
          size="xm"
          rightIcon={
            showNextSteps ? <ChevronUp size={24} /> : <ChevronDown size={24} />
          }
          pl="2"
          pr="1"
          onClick={() => {
            setShowNextSteps((v) => !v);
            if (!pressedBefore) {
              setPressedBefore(true);
              debouncedLoadData();
            }
          }}
        >
          Steps
        </Button>
        {showNextSteps && (
          <Skeleton isLoaded={steps.length > 0} mt="2" w="80%">
            <Box mb="2" fontWeight="bold" >
            {firstParagraph ? <Text>{firstParagraph}</Text> : <Text>{"placeholder ".repeat(100)}</Text>}</Box>
            <VStack alignItems="flex-start">
              {(steps.length > 0? steps:["testing", "testing", "testing"]).map((step, i) => (
                <Checkbox key={i}>{step}</Checkbox>
              ))}
            </VStack>
          </Skeleton>
        )}
      </Box>
    </HStack>
  );
}
