import { Middleware } from "../../../mod.ts";

const tasks = [
  "refactor main.ts into MVC structure",
  "setup database to store tasks",
  "rewrite loader middleware to load tasks from db"
];

export const loadTasks: Middleware = function (ctx) {
  ctx.state.tasks = tasks
}