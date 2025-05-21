declare module 'rjsf-conditionals' {
  import { RJSFSchema, UiSchema } from '@rjsf/utils';
  import { ComponentType } from 'react';
  
  export default function applyRules(
    schema: RJSFSchema,
    uiSchema: UiSchema,
    rules: any[],
    engine: any
  ): (Form: ComponentType<any>) => ComponentType<any>;
} 