import { assign, createMachine, sendTo } from "xstate";
import { Task } from "../types";
import { TaskQueueActorRef, taskQueue } from "./taskQueue";
import { randomIntFromInterval } from "../utils";

/** @xstate-layout N4IgpgJg5mDOIC5QBUDuB7ABASQHYDd0BrMAYmQENYjMAHAJ3QGM5YBLXKTAIzCg9gBtAAwBdRKFrp2AFzbpcEkAA9EAJgBsAOgCMAZj3CAnCaMBWAOxm9GgCwAaEAE9EAWjVqAHFq8a1FtWENYTUjTTUAXwjHNCw8QhJyKhoGZlYOLgAzCjYAG0gRcSQQKVl5RWLVBA1DLXMLI1sgowtPI08HZzc1Wx0tC2FhHR1Bo2EzTzMNCyiYjBwCYjJKajpGFlh2TkxYAFcmFkgCsSVStjkFJSqbMy1bMxMNI31hPSsLRxcEVwMLOp0NGYzDoHkY9G1PLMQLEFgkwFoAMK5aSQcjoKBQfKFU7Sc7lK7qV5aaY9AEaTwDYYBT6IfS2f5qHStV7mMzCVpQmHxJZaADytDAuFIAEEIBBMDJktjimcLhVQFUzL0fJ4vGM3hYNDoejSEADhP07OS2bZPB1hJNOfNuSQ+QKhch0ZiwNLJLi5QS9WEtHpbAN2VYdLY7B1dR4+qrbHopuznkMplFoiBcOgIHAlFzFiQcWVLpU3Kbde5bpZWjUo+SNNM7Fa4ln4UiURAc3i8wrEMJdUHbLXYTz+YKWx78wg3n0wiNhvogRZp13fcT7lGg+YdJ5hnpExEgA */
export const machineTwoInvokes = createMachine(
  {
    id: "Two Invoke",
    tsTypes: {} as import("./machineTwoInvokes.typegen").Typegen0,

    context: {
      tasks: [],
    },

    schema: {
      context: {} as {
        tasks: {
          taskId: string;
          status: "idle" | "pending" | "success" | "failure";
        }[];
      },
      events: {} as
        | {
            type: "Add task";
            task: Task;
          }
        | {
            type: "Toggle";
          }
        | {
            type: "Update task status";
            taskId: string;
            status: "pending" | "success" | "failure";
          },
    },

    invoke: [
      {
        src: "Task queue",
        id: "Task queue 1",
      },
      {
        src: "Task queue",
        id: "Task queue 2",
      },
    ],

    states: {
      Closed: {
        on: {
          Toggle: "Open",
        },
      },

      Open: {
        on: {
          "Add task": {
            actions: [
              "Forward task to random task queue",
              "Assign task to context",
            ],
          },

          Toggle: "Closed",
        },
      },
    },

    initial: "Open",

    on: {
      "Update task status": {
        actions: "Assign new status to task in context",
      },
    },
  },
  {
    actions: {
      "Forward task to random task queue": sendTo(
        () => {
          return `Task queue ${randomIntFromInterval(
            1,
            2
          )}` as unknown as TaskQueueActorRef;
        },
        (_context, event) => ({
          type: "Add task to queue",
          task: event.task,
        })
      ),
      "Assign task to context": assign({
        tasks: (context, event) =>
          context.tasks.concat({
            taskId: event.task.id,
            status: "idle",
          }),
      }),
      "Assign new status to task in context": assign({
        tasks: (context, event) =>
          context.tasks.map((task) => {
            if (task.taskId !== event.taskId) {
              return task;
            }

            return {
              taskId: task.taskId,
              status: event.status,
            } as const;
          }),
      }),
    },
    services: {
      "Task queue": taskQueue,
    },
  }
);
