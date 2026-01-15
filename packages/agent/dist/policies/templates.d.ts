export interface PolicyTemplate {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category?: string;
    policy: any;
}
export declare const policyTemplates: PolicyTemplate[];
export declare function getAllTemplates(): PolicyTemplate[];
export declare function getTemplatesByAdapter(adapterId: string): PolicyTemplate[];
