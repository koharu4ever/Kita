import type { GameDetail } from "@/features/games/types/game-detail";

export const GAME_ARCHIVE_LINK_LABEL = "Game archive";

export function getGameArchiveLink(links: GameDetail["links"]) {
  const normalizedArchiveLabel = GAME_ARCHIVE_LINK_LABEL.toLowerCase();

  return links.find(
    (link) => link.label.trim().toLowerCase() === normalizedArchiveLabel,
  );
}
