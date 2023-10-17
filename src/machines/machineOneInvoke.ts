import { assign, createMachine, sendTo } from "xstate";
import { Task } from "../types";
import { taskQueue } from "./taskQueue";

/** @xstate-layout N4IgpgJg5mDOIC5QHkB2YAEBJVA3A9gNZgB0AwgDb6yQDEAKvlFBWANoAMAuoqAA7UAlgBdB+VLxAAPRAEYA7AGYSHAEwcAHIoCcHPRu06ALABoQAT0QaOJI4YCs6jfIBss+-PcBfL2bSYcAmISZD4wVFoAQQgIDGEAQ1hCTh4kEAFYETEJNJkERXl5FUV7bVV5DSMXbXcPM0sEKpIdVVl1WTcNAzsjHz90bDwiUlDwhiYWdm5JDKzxSTyFZTVNRUUXO3W9WXrEdXsSNvkOQyqjAu9fEH9BoLAGRMIMPgAnfABjOEzUKAwAIzAUEEqFgKRmQlE81yiCM8gOenUqiR1m02hcGl2CAAtKpFBpmoo7B5FLJrAojKo+tcBoFhg8ks83p9YN9fgAzeKCVgQMFpWaQnKgPL2fHyOwuDj2c6lRxKTE41QuWwUjgUoweKVueRUm604j0p6vD5fYG-WAAV3en0gkF5-Ah2QWexcyjK8lUaLhRiMJ1V8pKRRd9ncLS6cO1VNQ+AgcEkuqGxHBmQFToQbXlzhIWlhOg0sg41RcIp1NITpEo1EgSbmgukiAlmNk6uaIusivVmpKJYCZZCYVr-Md0PyBZI6McilUFKnHRcjebJS6ag29k79h8PiAA */
export const machineOneInvoke = createMachine(
  {
    id: "One Invoke",
    tsTypes: {} as import("./machineOneInvoke.typegen").Typegen0,

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
        | { type: "Task processing begins"; taskId: string }
        | { type: "Task processing failed"; taskId: string }
        | { type: "Task processing succeeded"; taskId: string },
    },

    invoke: {
      src: "Task queue",
      id: "Single task queue",
    },

    states: {
      Closed: {
        on: {
          Toggle: "Open",
        },
      },

      Open: {
        on: {
          "Add task": {
            actions: ["Forward task to task queue", "Assign task to context"],
          },

          Toggle: "Closed",
        },
      },
    },

    initial: "Closed",

    on: {
      "Task processing begins": {
        actions: "Assign new status to task in context",
      },

      "Task processing failed": {
        actions: "Assign new status to task in context",
      },

      "Task processing succeeded": {
        actions: "Assign new status to task in context",
      },
    },
  },
  {
    actions: {
      "Forward task to task queue": sendTo(
        "Single task queue",
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
              status:
                event.type === "Task processing begins"
                  ? "pending"
                  : event.type === "Task processing succeeded"
                  ? "success"
                  : event.type === "Task processing failed"
                  ? "failure"
                  : "idle",
            } as const;
          }),
      }),
    },
    services: {
      "Task queue": taskQueue,
    },
  }
);
