import { Body, Container, Head, Html } from "@react-email/components";
import type { ReactNode } from "react";

export function EmailLayout({ children }: { children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f6f6f6", margin: 0, padding: "24px 0" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            maxWidth: 600,
            margin: "0 auto",
            padding: 24,
            borderRadius: 8,
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
