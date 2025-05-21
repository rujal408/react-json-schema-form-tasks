import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home";
import FetchDataForm from "../pages/fetch-data-form";

const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/fetchForm", Component: FetchDataForm },
]);

export default router;
