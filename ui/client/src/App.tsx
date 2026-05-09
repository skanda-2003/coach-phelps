import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Deprecated from "./pages/Deprecated";
import Workouts from "./pages/Workouts";
import WorkoutTimer from "./pages/workout-timer";
import RunAnalytics from "./pages/RunAnalytics";
// Badminton analytics is preserved in BadmintonAnalytics.tsx — see that file for re-enable instructions.
// import BadmintonAnalytics from "./pages/BadmintonAnalytics";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/workouts/:id" component={WorkoutTimer} />
      <Route path="/analytics" component={RunAnalytics} />
      {/* <Route path="/analytics" component={BadmintonAnalytics} /> */}
      <Route path="/deprecated" component={Deprecated} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
