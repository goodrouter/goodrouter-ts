/**
 * @description
 * Default options to be passed to the router
 */
export const defaultRouterOptions = {
    /**
     * @description
     * Default encoding function to use, this is the encodeUriComponent function by default
     *
     * @param decodedValue value to be encoded
     * @param name name of the parameter
     * @returns encoded value
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    encode: (decodedValue: string, name: string) => encodeURIComponent(decodedValue),
    /**
     * @description
     * Default decoding function to use, this is the decodeURIComponent function by default
     *
     * @param encodedValue value to be decoded
     * @param name name of the parameter
     * @returns decoded value
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decode: (encodedValue: string, name: string) => decodeURIComponent(encodedValue),
};

/**
 * @description
 * Options to be passed to the router
 */
export interface RouterOptions {
    /**
     * @description
     * This function wil be used on each parameter value when parsing a route
     * 
     * @param decodedValue value to be encoded
     * @param name name of the parameter
     * @returns encoded value
     */
    encode?: (decodedValue: string, name: string) => string
    /**
     * @description
     * This function wil be used on each parameter value when constructing a route
     * 
     * @param encodedValue value to be decoded
     * @param name name of the parameter
     * @returns decoded value
     */
    decode?: (encodedValue: string, name: string) => string
}
