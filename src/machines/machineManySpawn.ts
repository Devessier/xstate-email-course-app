import { assign, createMachine, sendTo, spawn } from "xstate";
import { Task } from "../types";
import { TaskQueueActorRef, taskQueue } from "./taskQueue";
import { randomIntFromInterval } from "../utils";

/** @xstate-layout N4IgpgJg5mDOIC5QFkCGA7AngAgMoAdUB3dAYgBVVYBrbfAJwHsBjOWAS3SmwCMwpOsANoAGALqJQ+RhwAu7RukkgAHogC0AFgB0ARl0BmEboCsugGy6ATOYMBOABwOANCEwarDk9qsmD5zxNzOzsTBwMAXwjXNCw8QhIKKloGFjZObgAzVHYAG0hRCSQQaTkFJWK1BBMRO20AgwMrTTsrZs0zTVd3BHVfEW0Adn1HEUGTO01xq0GomIwcAmIySho6JlZYDi5sWABXZlZIAvFlUvZ5RWUqm3Mhwat7TUeDQ0HBg26NZ51XuxEmoNnkEPnMQLFFgl0NoAMK5GSQCiMKBQfKFM4yC7la6IfQGeptMIOETNAwmTSacxfBC6QbaTQickOVp+QwOB5giHxZbaADy+DAZAAghAINhZMl0cVzpcKqAqv58b4zOY-JTGdZqbo7LptBrmVYAQ8ySYTJyFtySHyBStkaiwFKpJjZTiaQztPZhg5NLovEESVS3LjgtpyboSQYPnZ-GHzXEllb+YLSDD6GBULIwNgiIx6NQwPRHSVndjKogDFNQzYrI4rOHHuEukHes16v8niZBozBnZbFFoiB0IwIHBlFyE3Li2UrmXeuY7iIRPOjJTKUDO9T1KYHNodQ9LA9tQZiVY45CeXCERAMdPJ1UtzvF8uRKvzOuHtTvR7F532vZiRYZ6WtCSaTjKpbyogzR1I8wRki0LTmEuLjNkCu7qgC0Y6pYNj9hEQA */
export const machineManySpawn = createMachine(
  {
    id: "Many Spawn",
    tsTypes: {} as import("./machineManySpawn.typegen").Typegen0,

    context: {
      tasks: [],
      workers: [],
    },

    schema: {
      context: {} as {
        tasks: {
          taskId: string;
          status: "idle" | "pending" | "success" | "failure";
        }[];
        workers: TaskQueueActorRef[];
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
          }
        | { type: "Create worker" },
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
            actions: [
              "Forward task to random task queue",
              "Assign task to context",
            ],
          },

          Toggle: "Closed",

          "Create worker": {
            actions: "Spawn a task queue",
          },
        },
      },
    },

    initial: "Open",

    on: {
      "Update task status": {
        actions: "Assign new status to task in context",
      },
    },

    entry: "Spawn a task queue",
  },
  {
    actions: {
      "Forward task to random task queue": sendTo(
        (context) => {
          return context.workers[
            randomIntFromInterval(0, context.workers.length - 1)
          ];
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
      "Spawn a task queue": assign({
        workers: (context) =>
          context.workers.concat(
            spawn(taskQueue, {
              name: `Task queue ${context.workers.length + 1}`,
            })
          ),
      }),
    },
  }
);
