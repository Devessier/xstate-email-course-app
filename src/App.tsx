import {
  Box,
  Button,
  ChakraProvider,
  Code,
  Container,
  HStack,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useActor, useMachine } from "@xstate/react";
import { machineOneInvoke } from "./machines/machineOneInvoke";
import { TaskQueueActorRef } from "./machines/taskQueue";

function TaskQueueStatus({ actorRef }: { actorRef: TaskQueueActorRef }) {
  const [state] = useActor(actorRef);

  return (
    <VStack borderWidth={1} p="4" alignItems="start">
      <Text fontWeight="semibold">Task queue #1</Text>

      <Text>State: <Code>{String(state.value)}</Code></Text>

      <Box>
        <Text>Pending tasks:</Text>

        <Code whiteSpace="pre">{JSON.stringify(state.context.tasks, null, 2)}</Code>
      </Box>
    </VStack>
  );
}

function Panel1() {
  const [state, send] = useMachine(machineOneInvoke);

  return (
    <Box>
      <Text>
        Current state of the queue: <Code>{String(state.value)}</Code>
      </Text>

      <HStack>
        <Button
          size="sm"
          mt="4"
          onClick={() => {
            send({
              type: "Toggle",
            });
          }}
        >
          Toggle state
        </Button>

        {state.matches("Open") ? (
          <Button
            size="sm"
            mt="4"
            onClick={() => {
              send({
                type: "Add task",
                task: {
                  id: Math.random().toString(),
                  payload: {
                    fileContent: "content",
                  },
                },
              });
            }}
          >
            Add task
          </Button>
        ) : null}
      </HStack>

      <VStack alignItems="stretch" mt="12">
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">Machine's tasks results</Heading>

        <Code whiteSpace="pre">{JSON.stringify(state.context.tasks, null, 2)}</Code>
      </VStack>

      <VStack alignItems="stretch" mt="12">
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">Task queues</Heading>

        <TaskQueueStatus
          actorRef={state.children["Single task queue"] as TaskQueueActorRef}
        />
      </VStack>
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider>
      <Box py="10">
        <Container maxW="3xl">
          <Heading as="h1">Tiny Task Queue</Heading>

          <Tabs mt="6">
            <TabList>
              <Tab>Invoke (1)</Tab>
              <Tab>Invoke (2)</Tab>
              <Tab>Spawn (many)</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Panel1 />
              </TabPanel>
              <TabPanel>
                <p>two!</p>
              </TabPanel>
              <TabPanel>
                <p>three!</p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
