import {
  Box,
  Button,
  ChakraProvider,
  Code,
  Container,
  Flex,
  HStack,
  Heading,
  Link,
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
import { machineTwoInvokes } from "./machines/machineTwoInvokes";
import { machineManySpawn } from "./machines/machineManySpawn";

function TaskQueueStatus({
  actorRef,
  taskQueueId,
}: {
  actorRef: TaskQueueActorRef;
  taskQueueId: string;
}) {
  const [state] = useActor(actorRef);

  return (
    <VStack borderWidth={1} p="4" alignItems="start">
      <Text fontWeight="semibold">Task queue #{taskQueueId}</Text>

      <Text>
        State: <Code>{String(state.value)}</Code>
      </Text>

      <Box>
        <Text>Pending tasks:</Text>

        <Code whiteSpace="pre">
          {JSON.stringify(state.context.tasks, null, 2)}
        </Code>
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
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">
          Machine's tasks results
        </Heading>

        <Code whiteSpace="pre">
          {JSON.stringify(state.context.tasks, null, 2)}
        </Code>
      </VStack>

      <VStack alignItems="stretch" mt="12">
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">
          Task queues
        </Heading>

        <TaskQueueStatus
          actorRef={state.children["Single task queue"] as TaskQueueActorRef}
          taskQueueId="1"
        />
      </VStack>
    </Box>
  );
}

function Panel2() {
  const [state, send] = useMachine(machineTwoInvokes);

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
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">
          Machine's tasks results
        </Heading>

        <Code whiteSpace="pre">
          {JSON.stringify(state.context.tasks, null, 2)}
        </Code>
      </VStack>

      <VStack alignItems="stretch" mt="12">
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">
          Task queues
        </Heading>

        <TaskQueueStatus
          actorRef={state.children["Task queue 1"] as TaskQueueActorRef}
          taskQueueId="1"
        />

        <TaskQueueStatus
          actorRef={state.children["Task queue 2"] as TaskQueueActorRef}
          taskQueueId="2"
        />
      </VStack>
    </Box>
  );
}

function Panel3() {
  const [state, send] = useMachine(machineManySpawn);

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
          <>
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

            <Button
              size="sm"
              mt="4"
              onClick={() => {
                send({
                  type: "Create worker",
                });
              }}
            >
              Create worker
            </Button>
          </>
        ) : null}
      </HStack>

      <VStack alignItems="stretch" mt="12">
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">
          Machine's tasks results
        </Heading>

        <Code whiteSpace="pre">
          {JSON.stringify(state.context.tasks, null, 2)}
        </Code>
      </VStack>

      <VStack alignItems="stretch" mt="12">
        <Heading as="h2" fontWeight="semibold" fontSize="xl" mb="4">
          Task queues
        </Heading>

        {state.context.workers.map((worker, index) => (
          <TaskQueueStatus actorRef={worker} taskQueueId={String(index + 1)} />
        ))}
      </VStack>
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider>
      <Box position="relative">
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
                  <Panel2 />
                </TabPanel>
                <TabPanel>
                  <Panel3 />
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Box mt="6">
              <Text textAlign="center">
                An example of task workers implemented with XState by{" "}
                <Link href="https://baptiste.devessier.fr" color="red.600" fontWeight="semibold">
                  Baptiste Devessier
                </Link>
              </Text>
            </Box>
          </Container>
        </Box>

        <Flex
          position="absolute"
          top={0}
          right={0}
          justifyContent="center"
          alignItems="center"
          p="1"
          m="4"
          color="white"
          bg="gray.800"
          rounded="md"
          shadow="lg"
        >
          <a href="https://github.com/Devessier/xstate-email-course-app">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              ></path>
            </svg>
          </a>
        </Flex>
      </Box>
    </ChakraProvider>
  );
}

export default App;
