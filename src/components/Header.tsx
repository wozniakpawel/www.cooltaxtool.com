import { Navbar, Container, Form } from "react-bootstrap";

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

const Header = ({ theme, toggleTheme }: HeaderProps) => {
  return (
    <Navbar className="ctt-header">
      <Container className="justify-content-between align-items-end">
        <Navbar.Brand>
          <h1 className="ctt-wordmark">
            Cool<span className="warm">Tax</span>Tool
          </h1>
          <div className="ctt-tagline">UK Tax Calculator &amp; Visualiser</div>
        </Navbar.Brand>
        <Form.Check
          type="switch"
          id="themeToggle"
          label="Dark mode"
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
      </Container>
    </Navbar>
  );
};

export default Header;
