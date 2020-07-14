/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExpressionEvaluator, EvaluateExpressionDelegate } from '../expressionEvaluator';
import { FunctionUtils } from '../functionUtils';
import moment from 'moment';
import { Expression } from '../expression';
import { ReturnType } from '../returnType';
import { MemoryInterface } from '../memory/memoryInterface';
import { Options } from '../options';

/**
 * Evaluator that transforms a date-time to another date-time.
 */
export class TimeTransformEvaluator extends ExpressionEvaluator {
    public constructor(type: string, func: (timestamp: Date, numOfTransformation: any) => Date) {
        super(type, TimeTransformEvaluator.evaluator(func), ReturnType.String, TimeTransformEvaluator.validator);
    }

    private static evaluator(func: (timestamp: Date, numOfTransformation: any) => Date): EvaluateExpressionDelegate {
        return (expression: Expression, state: MemoryInterface, options: Options): {value: any; error: string} => {
            let result: any;
            let error: string;
            let value: any;
            let args: any[];
            let format = FunctionUtils.DefaultDateTimeFormat;
            let locale = options.locale;
            ({args, error} = FunctionUtils.evaluateChildren(expression, state, options));
            
            if (!error) {
                ({format, locale} = FunctionUtils.determineFormatAndLocale(args, format, locale, 4));
            }

            if (!error) {
                if (typeof args[0] === 'string' && typeof args[1] === 'number') {
                    ({value, error} = FunctionUtils.parseTimestamp(args[0]));
                    if (!error) {
                        if (args.length === 4 && typeof args[3] === 'string') {
                            result = moment(func(value, args[1])).utc().locale(locale).toString();
                        }
                        else if (args.length === 3 && typeof args[2] === 'string') {
                            result = moment(func(value, args[1])).utc().format(format);
                        } else {
                            result = func(value, args[1]).toISOString();
                        }
                    }
                } else {
                    error = `${expression} could not be evaluated`;
                }
            }

            return {value: result, error};
        };
    }

    private static validator(expression: Expression): void {
        FunctionUtils.validateOrder(expression, [ReturnType.String, ReturnType.String], ReturnType.String, ReturnType.Number);
    }
}