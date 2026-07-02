import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, ButtonGroup, Button } from "react-bootstrap";
import { defaultInputs, UserMenu } from "./components/UserMenu";
import TaxYearOverview from "./components/TaxYearOverview";
import IncomeAnalysis from "./components/IncomeAnalysis";
import PayePlanner from "./components/PayePlanner";
import Header from "./components/Header";
import Footer from "./components/Footer";
import type { TaxInputs } from "./types/tax";
import "bootstrap/dist/css/bootstrap.min.css";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

type View = "myTaxes" | "explorer" | "paye";

const views: { key: View; label: string }[] = [
  { key: "myTaxes", label: "My Taxes" },
  { key: "explorer", label: "Income Explorer" },
  { key: "paye", label: "PAYE Planner" },
];

function App() {
  const [userInputs, setUserInputs] = useState(defaultInputs);
  const [view, setView] = useState<View>("myTaxes");
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const handleUserInputsChange = useCallback((inputs: TaxInputs) => {
    setUserInputs(inputs);
  }, []);

  return (
    <Container fluid className="d-flex flex-column min-vh-100 p-0">
      <Container className="page-content p-0">
        <Row>
          <Col xs={12} lg={6}>
            <Header theme={theme} toggleTheme={toggleTheme} />
            <UserMenu onUserInputsChange={handleUserInputsChange} />
          </Col>
          <Col xs={12} lg={6} className="pt-3">
            <ButtonGroup className="mb-3">
              {views.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={view === key ? "primary" : "outline-primary"}
                  onClick={() => setView(key)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
            {view === "myTaxes" && <IncomeAnalysis inputs={userInputs} theme={theme} />}
            {view === "explorer" && <TaxYearOverview inputs={userInputs} theme={theme} />}
            {view === "paye" && <PayePlanner inputs={userInputs} theme={theme} />}
          </Col>
        </Row>
      </Container>
      <Footer />
    </Container>
  );
}

export default App;
