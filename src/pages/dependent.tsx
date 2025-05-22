import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import Nav from "../components/nav";
import { docUploadSchema } from "../constants/dependent";

const Dependent = () => (
  <div>
    <Nav />
    <Form
      schema={docUploadSchema}
      // uiSchema={uiSchema}
      // formData={formData}
      validator={validator}

      // liveValidate
    />
  </div>
);

export default Dependent;
