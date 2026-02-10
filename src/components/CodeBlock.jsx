import { S } from "../styles";

export function CodeBlock({ code }) {
  return (
    <pre style={S.codeBlock}>
      <code>{code}</code>
    </pre>
  );
}
