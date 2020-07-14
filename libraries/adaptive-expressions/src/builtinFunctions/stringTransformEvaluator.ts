/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExpressionEvaluator, ValidateExpressionDelegate } from '../expressionEvaluator';
import { FunctionUtils } from '../functionUtils';
import { ReturnType } from '../returnType';
import { Options } from '../options';

/**
 * Evaluator that transforms a string to another string.
 */
export class StringTransformEvaluator extends ExpressionEvaluator {
    public constructor(type: string, func: (arg0: any[], options?: Options) => string, validator?: ValidateExpressionDelegate) {
        super(type, FunctionUtils.apply(func, FunctionUtils.verifyStringOrNull),
            ReturnType.String, validator ? validator : FunctionUtils.validateUnary);
    }
}