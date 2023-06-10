import {
  Box,
  Button,
  HStack,
  Heading,
  Image,
  ListItem,
  OrderedList,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "react-feather";

export default function Future({ prediction, profile }: { prediction: any, profile: any }) {
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [pressedBefore, setPressedBefore] = useState(false);
  const [steps, setSteps] = useState([]);

  const loadData = () => {
    (async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict_next_steps`, {
            method: "POST",
            body: JSON.stringify(profile),
        });

        const data = (await res.json()).nextSteps;
        setSteps(data);
    })();
  };

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
          {prediction?.description ?? "Dummy"}
        </Text>
        <Button
            mt="2"
          size="xm"
          rightIcon={
            showNextSteps ? <ChevronUp size={24} /> : <ChevronDown size={24} />
          }
          pl="2"
          pr="1"
          onClick={() => {
            setShowNextSteps((v) => !v);
            if (!pressedBefore) {
              loadData();
            }
            setPressedBefore(true);
          }}
        >
          Steps
        </Button>
        {showNextSteps && (
          <Skeleton isLoaded={steps.length > 0} mt="2">
            <OrderedList>
              {(steps.length > 0?steps:["testing", "testing", "testing"]).map((step, i) => (
                <ListItem key={i}>{step}</ListItem>
              ))}
            </OrderedList>
          </Skeleton>
        )}
      </Box>
    </HStack>
  );
}
