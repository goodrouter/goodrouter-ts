export interface Route {
    /**
     * @description
     * name of the route
     */
    name: string;
    /**
     * @description
     * parameters of this route
     */
    parameters: Record<string, string>;
}
