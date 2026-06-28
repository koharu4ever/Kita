import * as migration_20260614_112311_init from "./20260614_112311_init";
import * as migration_20260628_133544 from "./20260628_133544";

export const migrations = [
  {
    up: migration_20260614_112311_init.up,
    down: migration_20260614_112311_init.down,
    name: "20260614_112311_init",
  },
  {
    up: migration_20260628_133544.up,
    down: migration_20260628_133544.down,
    name: "20260628_133544",
  },
];
