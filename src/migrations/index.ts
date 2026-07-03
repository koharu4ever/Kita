import * as migration_20260614_112311_init from "./20260614_112311_init";
import * as migration_20260628_133544 from "./20260628_133544";
import * as migration_20260702_161526 from "./20260702_161526";
import * as migration_20260703_132233 from "./20260703_132233";

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
  {
    up: migration_20260702_161526.up,
    down: migration_20260702_161526.down,
    name: "20260702_161526",
  },
  {
    up: migration_20260703_132233.up,
    down: migration_20260703_132233.down,
    name: "20260703_132233",
  },
];
