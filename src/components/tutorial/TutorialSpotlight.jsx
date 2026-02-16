import { S } from "../../styles";

export function TutorialSpotlight({ rect, padding = 10 }) {
  if (!rect) return null;

  const top = Math.max(8, Math.round(rect.top - padding));
  const left = Math.max(8, Math.round(rect.left - padding));
  const width = Math.max(24, Math.round(rect.width + padding * 2));
  const height = Math.max(24, Math.round(rect.height + padding * 2));

  return (
    <div
      aria-hidden="true"
      style={{
        ...S.tutorialSpotlight,
        top,
        left,
        width,
        height,
      }}
    />
  );
}
