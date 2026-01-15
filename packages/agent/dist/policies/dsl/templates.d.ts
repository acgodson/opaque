import type { PolicyDocument } from "./types.js";
export interface PolicyTemplate {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category?: string;
    policy: PolicyDocument;
}
export declare const policyTemplates: PolicyTemplate[];
export declare function getAllTemplates(): PolicyTemplate[];
export declare function getTemplatesByAdapter(adapterId: string): PolicyTemplate[];
export declare function getTemplateByName(name: string): PolicyTemplate | undefined;
