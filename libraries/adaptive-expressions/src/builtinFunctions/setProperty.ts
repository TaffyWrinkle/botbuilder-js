/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExpressionEvaluator, EvaluateExpressionDelegate } from '../expressionEvaluator';
import { Expression } from '../expression';
import { ReturnType } from '../returnType';
import { ExpressionType } from '../expressionType';
import { FunctionUtils } from '../functionUtils';

/**
 * Set the value of an object's property and return the updated object. 
 */
export class SetProperty extends ExpressionEvaluator {
    public constructor(){
        super(ExpressionType.SetProperty, SetProperty.evaluator(), ReturnType.Object, SetProperty.validator);
    }

    private static evaluator(): EvaluateExpressionDelegate {
        return FunctionUtils.apply(
            (args: any[]): any => {
                const temp: any = args[0];
                temp[String(args[1])] = args[2];

                return temp;
            });
    }

    private static validator(expression: Expression): void {
        FunctionUtils.validateOrder(expression, undefined, ReturnType.Object, ReturnType.String, ReturnType.Object);
    }
}