import { ActorRefFrom, assign, createMachine, sendParent } from "xstate";
import { Task } from "../types";

function waitForTimeout() {
  const minTimeout = 3_000;
  const maxTimeout = 5_000;
  const ms = Math.floor(Math.random() * (maxTimeout - minTimeout) + minTimeout);

  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function taskAsPromise() {
  await waitForTimeout();

  const shouldThrow = Math.random() < 0.2;
  if (shouldThrow) {
    throw new Error("Processing failed");
  }
}

/** @xstate-layout N4IgpgJg5mDOIC5QBUCGsDWACAigVzAIGIBBCCLAF3W0oHssBHAggbQAYBdRUABztgBLSoLoA7HiAAeiAEwBOABwA6AOwA2eQEZ2W2QFZtAZnbr9AGhABPRAFot69sv06lAFi0bV8t24C+fpZomLgsYMoAkhAANmBEHNxIIPxCIuKSMgiyRrLOnoqKslqK8kZuRvLqljYIZW7K2sX6ivpuqvqqqooBQTShhOEACgBOdADGcEJiUEQQ4uGCYgBudBjhwdj4A8oj45OLUAiLK2OoaWIJCZIpwqISSZkO9eqyHopGnfKy7EbViMVaZSFRyqLQ+diyWTqVQ9EAbfoEHajCawKYzMDDUbDZS8aJnABmdGGAFtlPCtojdii0UdluMzndLlxrgJbukHv91M9XsUPt5viY3H9arkujlTC8fiZWgFAiAxHQIHBJOSwizUncMnYtMLbK1nIUikYjCV2j8YXLVdsorF1Wz7qBMm1hd95MpxVCfCVyvzYVbKcj9tM7ectQg3D4Gq03IpNKo3K1IcLPG75N5iuotIL5JVZX4gA */
export const taskQueue = createMachine(
  {
    id: "Task Queue",
    tsTypes: {} as import("./taskQueue.typegen").Typegen0,
    schema: {
      events: {} as { type: "Add task to queue"; task: Task },
      context: {} as { tasks: Task[] },
    },
    context: {
      tasks: [],
    },
    initial: "Idle",
    states: {
      Idle: {
        always: {
          target: "Processing",
          cond: "Task available",
        },
      },
      Processing: {
        invoke: {
          src: "Process task",

          onDone: {
            target: "Idle",
            actions: [
              "Report task success to parent",
              "Delete first task from queue in context",
            ],
          },

          onError: {
            target: "Idle",
            actions: [
              "Report task failure to parent",
              "Delete first task from queue in context",
            ],
          },
        },

        entry: "Report task processing begins to parent",
      },
    },
    on: {
      "Add task to queue": {
        actions: "Assign task to queue in context",
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {
      "Delete first task from queue in context": assign({
        tasks: (context) => context.tasks.slice(1),
      }),

      "Assign task to queue in context": assign({
        tasks: (context, event) => context.tasks.concat(event.task),
      }),
      "Report task failure to parent": sendParent((context) => ({
        type: "Update task status",
        taskId: context.tasks[0].id,
        status: "failure",
      })),
      "Report task success to parent": sendParent((context) => ({
        type: "Update task status",
        taskId: context.tasks[0].id,
        status: "success",
      })),
      "Report task processing begins to parent": sendParent((context) => ({
        type: "Update task status",
        taskId: context.tasks[0].id,
        status: "pending",
      })),
    },
    services: {
      "Process task": taskAsPromise,
    },
    guards: {
      "Task available": (context) => context.tasks.length > 0,
    },
  }
);

export type TaskQueueActorRef = ActorRefFrom<typeof taskQueue>;
