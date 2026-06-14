import * as migration_20260614_112311_init from "./20260614_112311_init";

export const migrations = [
  {
    up: migration_20260614_112311_init.up,
    down: migration_20260614_112311_init.down,
    name: "20260614_112311_init",
  },
];
