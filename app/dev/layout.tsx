export const metadata = {
  title: "Dev Tools",
  description: "Snakebet development tools",
};

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
