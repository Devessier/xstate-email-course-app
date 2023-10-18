import { createMachine, interpret } from "xstate";
import { TaskQueueActorRef, taskQueue } from "./taskQueue";
import { expect, test, vi } from "vitest";

test("Waits for tasks", () => {
  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": vi.fn().mockResolvedValue(undefined),
    },
  });

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  expect(taskQueueService.getSnapshot()!.matches("Idle")).toBe(true);
});

test("Waits for task, processes it, and then goes back to Idle state", async () => {
  const processTaskFn = vi.fn().mockResolvedValue(undefined);

  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": processTaskFn,
    },
  });

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  taskQueueService.send({
    type: "Add task to queue",
    task: {
      id: "1",
      payload: { fileContent: "" },
    },
  });

  await vi.waitFor(() => {
    expect(processTaskFn).toHaveBeenCalledOnce();
  });

  await vi.waitFor(() => {
    expect(taskQueueService.getSnapshot()!.matches("Idle")).toBe(true);
  });
});

test("Processes all pending tasks", async () => {
  const numberOfTasksToCreate = 3;

  const processTaskFn = vi.fn().mockResolvedValue(undefined);

  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": processTaskFn,
    },
  });

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  for (let index = 0; index < numberOfTasksToCreate; index++) {
    taskQueueService.send({
      type: "Add task to queue",
      task: {
        id: String(index + 1),
        payload: { fileContent: "" },
      },
    });
  }

  await vi.waitFor(() => {
    expect(processTaskFn).toHaveBeenCalledTimes(numberOfTasksToCreate);
  });

  await vi.waitFor(() => {
    expect(taskQueueService.getSnapshot()!.matches("Idle")).toBe(true);
  });
});

test("Does not crash when an error occurs during the processing", async () => {
  const processTaskFn = vi
    .fn()
    .mockRejectedValue(new Error("Failed to process the task"));

  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": processTaskFn,
    },
  });

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  taskQueueService.send({
    type: "Add task to queue",
    task: {
      id: "1",
      payload: { fileContent: "" },
    },
  });

  await vi.waitFor(() => {
    expect(processTaskFn).toHaveBeenCalledOnce();
  });

  await vi.waitFor(() => {
    expect(taskQueueService.getSnapshot()!.matches("Idle")).toBe(true);
  });
});

test("Forwards pending status to the parent machine", async () => {
  const processTaskFn = vi.fn().mockResolvedValue(undefined);

  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": processTaskFn,
    },
  });

  const onUpdateTaskStatusFn = vi.fn();

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    on: {
      "Update task status": {
        actions: onUpdateTaskStatusFn,
      },
    },
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  taskQueueService.send({
    type: "Add task to queue",
    task: {
      id: "1",
      payload: { fileContent: "" },
    },
  });

  await vi.waitFor(() => {
    expect(onUpdateTaskStatusFn).toHaveBeenNthCalledWith(
      1,
      undefined, // The empty context of the wrapper machine.
      {
        type: "Update task status",
        taskId: "1",
        status: "pending",
      },
      expect.any(Object) // The `state` (3rd) parameter of the action.
    );
  });
});

test("Forwards success status to the parent machine", async () => {
  const processTaskFn = vi.fn().mockResolvedValue(undefined);

  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": processTaskFn,
    },
  });

  const onUpdateTaskStatusFn = vi.fn();

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    on: {
      "Update task status": {
        actions: onUpdateTaskStatusFn,
      },
    },
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  taskQueueService.send({
    type: "Add task to queue",
    task: {
      id: "1",
      payload: { fileContent: "" },
    },
  });

  await vi.waitFor(() => {
    expect(onUpdateTaskStatusFn).toHaveBeenCalledTimes(2);
    expect(onUpdateTaskStatusFn).toHaveBeenNthCalledWith(
      2,
      undefined, // The empty context of the wrapper machine.
      {
        type: "Update task status",
        taskId: "1",
        status: "success",
      },
      expect.any(Object) // The `state` (3rd) parameter of the action.
    );
  });
});

test("Forwards failure status to the parent machine", async () => {
  const processTaskFn = vi
    .fn()
    .mockRejectedValue(new Error("Failed to process the task"));

  const mockedMachine = taskQueue.withConfig({
    services: {
      "Process task": processTaskFn,
    },
  });

  const onUpdateTaskStatusFn = vi.fn();

  const rootMachine = createMachine({
    invoke: {
      src: mockedMachine,
      id: "taskQueue",
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    on: {
      "Update task status": {
        actions: onUpdateTaskStatusFn,
      },
    },
  });

  const rootService = interpret(rootMachine).start();
  const taskQueueService = rootService.getSnapshot().children
    .taskQueue as TaskQueueActorRef;

  taskQueueService.send({
    type: "Add task to queue",
    task: {
      id: "1",
      payload: { fileContent: "" },
    },
  });

  await vi.waitFor(() => {
    expect(onUpdateTaskStatusFn).toHaveBeenCalledTimes(2);
    expect(onUpdateTaskStatusFn).toHaveBeenNthCalledWith(
      2,
      undefined, // The empty context of the wrapper machine.
      {
        type: "Update task status",
        taskId: "1",
        status: "failure",
      },
      expect.any(Object) // The `state` (3rd) parameter of the action.
    );
  });
});
