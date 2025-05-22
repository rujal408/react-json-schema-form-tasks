import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home";
import FetchDataForm from "../pages/fetch-data-form";
import Dependent from "../pages/dependent";

const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/fetchForm", Component: FetchDataForm },
  { path: "/dependent", Component: Dependent },
]);

export default router;
