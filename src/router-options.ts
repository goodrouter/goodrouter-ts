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
     * @param parameterName name of the parameter
     * @returns encoded value
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    encode: (decodedValue: string, parameterName: string) => encodeURIComponent(decodedValue),
    /**
     * @description
     * Default decoding function to use, this is the decodeURIComponent function by default
     *
     * @param encodedValue value to be decoded
     * @param parameterName name of the parameter
     * @returns decoded value
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decode: (encodedValue: string, parameterName: string) => decodeURIComponent(encodedValue),

    /**
     * Use `{` and `}` as a default for matching placeholders in the route templates.
     */
    placeholderRE: /\{(.*?)\}/gu,

    /**
     * Assume a maximum parameter value length of 20
     */
    maximumParameterValueLength: 20,
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
     * @param parameterName name of the parameter
     * @returns encoded value
     */
    encode?: (decodedValue: string, parameterName: string) => string
    /**
     * @description
     * This function wil be used on each parameter value when constructing a route
     * 
     * @param encodedValue value to be decoded
     * @param parameterName name of the parameter
     * @returns decoded value
     */
    decode?: (encodedValue: string, parameterName: string) => string

    /**
     * Regular expression to use when parsing placeholders from a route template. This regular
     * expression must have the global option set! Defaults to `/\{(.*?)\}/gu`.
     */
    placeholderRE?: RegExp,

    /**
     * The expected maximum character length of a parameter value. No parameter value should
     * be longer than what is specified here!
     */
    maximumParameterValueLength?: number,

}
