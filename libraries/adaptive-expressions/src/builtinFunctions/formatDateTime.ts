import { ExpressionEvaluator, EvaluateExpressionDelegate } from '../expressionEvaluator';
import { ReturnType, Expression } from '../expression';
import { ExpressionType } from '../expressionType';
import { FunctionUtils } from '../functionUtils';
import moment from 'moment';

export class FormatDateTime extends ExpressionEvaluator {
    public constructor(){
        super(ExpressionType.FormatDateTime, FormatDateTime.evaluator(), ReturnType.String, FormatDateTime.validator);
    }

    private static evaluator(): EvaluateExpressionDelegate {
        return FunctionUtils.applyWithError(
            (args: any[]): any => {
                let error: string;
                let arg: any = args[0];
                if (typeof arg === 'string') {
                    error = FunctionUtils.verifyTimestamp(arg.toString());
                } else {
                    arg = arg.toString();
                }
                let value: any;
                if (!error) {
                    const dateString: string = new Date(arg).toISOString();
                    value = args.length === 2 ? moment(dateString).format(FunctionUtils.timestampFormatter(args[1])) : dateString;
                }

                return {value, error};
            });
    }

    private static validator(expression: Expression): void {
        FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.String);
    }
}