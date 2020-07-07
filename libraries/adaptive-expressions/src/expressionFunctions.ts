/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {TimexProperty} from '@microsoft/recognizers-text-data-types-timex-expression';
import moment, {Moment, parseZone} from 'moment';
import {CommonRegex} from './commonRegex';
import {Expression, ReturnType} from './expression';
import {EvaluateExpressionDelegate, ExpressionEvaluator, ValidateExpressionDelegate} from './expressionEvaluator';
import {ExpressionType} from './expressionType';
import {MemoryInterface, SimpleObjectMemory, StackedMemory} from './memory';
import {Options} from './options';
import atob = require('atob-lite');
import bigInt = require('big-integer');
import { FunctionUtils } from './functionUtils';


            new ExpressionEvaluator(
                ExpressionType.Join,
                (expression: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expression, state, options));
                    if (!error) {
                        if (!Array.isArray(args[0])) {
                            error = `${expression.children[0]} evaluates to ${args[0]} which is not a list.`;
                        } else {
                            if (args.length === 2) {
                                value = args[0].join(args[1]);
                            } else {
                                if (args[0].length < 3) {
                                    value = args[0].join(args[2]);
                                } else {
                                    const firstPart: string = args[0].slice(0, args[0].length - 1).join(args[1]);
                                    value = firstPart.concat(args[2], args[0][args[0].length - 1]);
                                }
                            }
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.Array, ReturnType.String)),
            // datetime
            FunctionUtils.timeTransform(ExpressionType.AddDays, (ts: Date, num: any): Date =>  moment(ts).utc().add(num, 'd').toDate()),
            FunctionUtils.timeTransform(ExpressionType.AddHours, (ts: Date, num: any): Date => moment(ts).utc().add(num, 'h').toDate()),
            FunctionUtils.timeTransform(ExpressionType.AddMinutes, (ts: Date, num: any): Date => moment(ts).utc().add(num, 'minutes').toDate()),
            FunctionUtils.timeTransform(ExpressionType.AddSeconds, (ts: Date, num: any): Date => moment(ts).utc().add(num, 'seconds').toDate()),
            new ExpressionEvaluator(
                ExpressionType.DayOfMonth,
                FunctionUtils.applyWithError(
                    (args: any[]): any => FunctionUtils.parseTimestamp(args[0], (timestamp: Date): number => timestamp.getUTCDate()),
                    FunctionUtils.verifyString),
                ReturnType.Number,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.DayOfWeek,
                FunctionUtils.applyWithError(
                    (args: any[]): any => FunctionUtils.parseTimestamp(args[0], (timestamp: Date): number => timestamp.getUTCDay()),
                    FunctionUtils.verifyString),
                ReturnType.Number,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.DayOfYear,
                FunctionUtils.applyWithError(
                    (args: any[]): any => FunctionUtils.parseTimestamp(args[0], (timestamp: Date): number => moment(timestamp).utc().dayOfYear()),
                    FunctionUtils.verifyString),
                ReturnType.Number,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.Month,
                FunctionUtils.applyWithError(
                    (args: any[]): any => FunctionUtils.parseTimestamp(args[0], (timestamp: Date): number => timestamp.getUTCMonth() + 1),
                    FunctionUtils.verifyString),
                ReturnType.Number,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.Date,
                FunctionUtils.applyWithError(
                    (args: any[]): any => FunctionUtils.parseTimestamp(args[0], (timestamp: Date): string => moment(timestamp).utc().format('M/DD/YYYY')),
                    FunctionUtils.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.Year,
                FunctionUtils.applyWithError(
                    (args: any[]): any => FunctionUtils.parseTimestamp(args[0], (timestamp: Date): number =>timestamp.getUTCFullYear()),
                    FunctionUtils.verifyString),
                ReturnType.Number,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.UtcNow,
                FunctionUtils.apply(
                    (args: any[]): string => args.length === 1 ? moment(new Date()).utc().format(args[0]) : new Date().toISOString(),
                    FunctionUtils.verifyString),
                ReturnType.String),
            new ExpressionEvaluator(
                ExpressionType.FormatDateTime,
                FunctionUtils.applyWithError(
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
                    }),
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.String)),
            new ExpressionEvaluator(
                ExpressionType.FormatEpoch,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let error: string;
                        let arg: any = args[0];
                        if (typeof arg !== 'number') {
                            error = `formatEpoch first argument ${arg} must be a number`
                        } else {
                            // Convert to ms
                            arg = arg * 1000
                        }

                        let value: any;
                        if (!error) {
                            const dateString: string = new Date(arg).toISOString();
                            value = args.length === 2 ? moment(dateString).format(FunctionUtils.timestampFormatter(args[1])) : dateString;
                        }

                        return {value, error};
                    }),
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.Number)),
            new ExpressionEvaluator(
                ExpressionType.FormatTicks,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let error: string;
                        let arg: any = args[0];
                        if (typeof arg === 'number') {
                            arg = bigInt(arg);
                        }
                        if (typeof arg === 'string') {
                            arg = bigInt(arg);
                        }
                        if (!bigInt.isInstance(arg)) {
                            error = `formatTicks first argument ${arg} is not a number, numeric string or bigInt`;
                        } else {
                            // Convert to ms
                            arg = ((arg.subtract(this.UnixMilliSecondToTicksConstant)).divide(this.MillisecondToTickConstant)).toJSNumber();
                        }

                        let value: any;
                        if (!error) {
                            const dateString: string = new Date(arg).toISOString();
                            value = args.length === 2 ? moment(dateString).format(FunctionUtils.timestampFormatter(args[1])) : dateString;
                        }

                        return {value, error};
                    }),
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.Number)),
            new ExpressionEvaluator(
                ExpressionType.SubtractFromTime,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: any;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof args[0] === 'string' && Number.isInteger(args[1]) && typeof args[2] === 'string') {
                            const format: string = (args.length === 4 ? FunctionUtils.timestampFormatter(args[3]) : FunctionUtils.DefaultDateTimeFormat);
                            const {duration, tsStr} = FunctionUtils.timeUnitTransformer(args[1], args[2]);
                            if (tsStr === undefined) {
                                error = `${args[2]} is not a valid time unit.`;
                            } else {
                                const dur: any = duration;
                                ({value, error} = FunctionUtils.parseTimestamp(args[0], (dt: Date): string => {
                                    return args.length === 4 ?
                                    moment(dt).utc().subtract(dur, tsStr).format(format) : moment(dt).utc().subtract(dur, tsStr).toISOString()}));
                            }
                        } else {
                            error = `${expr} can't evaluate.`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.String, ReturnType.Number, ReturnType.String)),
            new ExpressionEvaluator(
                ExpressionType.DateReadBack,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let value: any;
                        let error: string;
                        const dateFormat = 'YYYY-MM-DD';
                        ({value, error} = FunctionUtils.parseTimestamp(args[0]));
                        if (!error) {
                            const timestamp1: Date = new Date(value.format(dateFormat));
                            ({value, error} = FunctionUtils.parseTimestamp(args[1]));
                            const timestamp2: string = value.format(dateFormat);
                            const timex: TimexProperty = new TimexProperty(timestamp2);

                            return {value: timex.toNaturalLanguage(timestamp1), error};
                        }
                    },
                    FunctionUtils.verifyString),
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, undefined, ReturnType.String, ReturnType.String)),
            new ExpressionEvaluator(
                ExpressionType.GetTimeOfDay,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let value: any;
                        const error: string = FunctionUtils.verifyISOTimestamp(args[0]);
                        if (!error) {
                            const thisTime: number = parseZone(args[0]).hour() * 100 + parseZone(args[0]).minute();
                            if (thisTime === 0) {
                                value = 'midnight';
                            } else if (thisTime > 0 && thisTime < 1200) {
                                value = 'morning';
                            } else if (thisTime === 1200) {
                                value = 'noon';
                            } else if (thisTime > 1200 && thisTime < 1800) {
                                value = 'afternoon';
                            } else if (thisTime >= 1800 && thisTime <= 2200) {
                                value = 'evening';
                            } else if (thisTime > 2200 && thisTime <= 2359) {
                                value = 'night';
                            }
                        }

                        return {value, error};
                    },
                    this.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnaryString),
            new ExpressionEvaluator(
                ExpressionType.GetFutureTime,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: any;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (Number.isInteger(args[0]) && typeof args[1] === 'string') {
                            const format: string = (args.length === 3 ? FunctionUtils.timestampFormatter(args[2]) : FunctionUtils.DefaultDateTimeFormat);
                            const {duration, tsStr} = FunctionUtils.timeUnitTransformer(args[0], args[1]);
                            if (tsStr === undefined) {
                                error = `${args[2]} is not a valid time unit.`;
                            } else {
                                const dur: any = duration;
                                ({value, error} = FunctionUtils.parseTimestamp(new Date().toISOString(), (dt: Date): string => {
                                    return moment(dt).utc().add(dur, tsStr).format(format)}));
                            }
                        } else {
                            error = `${expr} can't evaluate.`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.Number, ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.GetPastTime,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: any;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (Number.isInteger(args[0]) && typeof args[1] === 'string') {
                            const format: string = (args.length === 3 ? FunctionUtils.timestampFormatter(args[2]) : FunctionUtils.DefaultDateTimeFormat);
                            const {duration, tsStr} = FunctionUtils.timeUnitTransformer(args[0], args[1]);
                            if (tsStr === undefined) {
                                error = `${args[2]} is not a valid time unit.`;
                            } else {
                                const dur: any = duration;
                                ({value, error} = FunctionUtils.parseTimestamp(new Date().toISOString(), (dt: Date): string => {
                                    return moment(dt).utc().subtract(dur, tsStr).format(format)}));
                            }
                        } else {
                            error = `${expr} can't evaluate.`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.Number, ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.ConvertFromUTC,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        const format: string = (args.length === 3) ? FunctionUtils.timestampFormatter(args[2]) : this.NoneUtcDefaultDateTimeFormat;
                        if (typeof (args[0]) === 'string' && typeof (args[1]) === 'string') {
                            ({value, error} = FunctionUtils.convertFromUTC(args[0], args[1], format));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.String, ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.ConvertToUTC,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        const format: string = (args.length === 3) ? FunctionUtils.timestampFormatter(args[2]) : this.DefaultDateTimeFormat;
                        if (typeof (args[0]) === 'string' && typeof (args[1]) === 'string') {
                            ({value, error} = FunctionUtils.convertToUTC(args[0], args[1], format));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.String, ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.AddToTime,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        const format: string = (args.length === 4) ? FunctionUtils.timestampFormatter(args[3]) : this.DefaultDateTimeFormat;
                        if (typeof (args[0]) === 'string' && Number.isInteger(args[1]) && typeof (args[2]) === 'string') {
                            ({value, error} = FunctionUtils.addToTime(args[0], args[1], args[2], format));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.String, ReturnType.Number, ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.StartOfDay,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        const format: string = (args.length === 2) ? FunctionUtils.timestampFormatter(args[1]) : this.DefaultDateTimeFormat;
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.startOfDay(args[0], format));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.StartOfHour,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        const format: string = (args.length === 2) ? FunctionUtils.timestampFormatter(args[1]) : this.DefaultDateTimeFormat;
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.startOfHour(args[0], format));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.StartOfMonth,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        const format: string = (args.length === 2) ? FunctionUtils.timestampFormatter(args[1]) : this.DefaultDateTimeFormat;
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.startOfMonth(args[0], format));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.String)
            ),
            new ExpressionEvaluator(
                ExpressionType.Ticks,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.ticks(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.Number,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.TicksToDays,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (Number.isInteger(args[0])) {
                            value = args[0] / this.TicksPerDay;
                        } else {
                            error = `${expr} should contain an integer of ticks`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.Number,
                FunctionUtils.validateUnaryNumber),
            new ExpressionEvaluator(
                ExpressionType.TicksToHours,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (Number.isInteger(args[0])) {
                            value = args[0] / this.TicksPerHour;
                        } else {
                            error = `${expr} should contain an integer of ticks`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.Number,
                FunctionUtils.validateUnaryNumber),
            new ExpressionEvaluator(
                ExpressionType.TicksToMinutes,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (Number.isInteger(args[0])) {
                            value = args[0] / this.TicksPerMinute;
                        } else {
                            error = `${expr} should contain an integer of ticks`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.Number,
                FunctionUtils.validateUnaryNumber),
            new ExpressionEvaluator(
                ExpressionType.DateTimeDiff,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let dateTimeStart: any;
                    let dateTimeEnd: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({value: dateTimeStart, error: error} = this.ticks(args[0]));
                        if (!error) {
                            ({value: dateTimeEnd, error: error} = this.ticks(args[1]));
                        }
                    }

                    if (!error) {
                        value = dateTimeStart - dateTimeEnd
                    }

                    return {value, error};
                },
                ReturnType.Number,
                expr => FunctionUtils.validateArityAndAnyType(expr, 2, 2, ReturnType.String)),
            new ExpressionEvaluator(
                ExpressionType.IsDefinite,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (!error) {
                        value = parsed != undefined && parsed.year !== undefined && parsed.month !== undefined && parsed.dayOfMonth !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.IsTime,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (parsed && !error) {
                        value = parsed.hour !== undefined && parsed.minute !== undefined && parsed.second !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.IsDuration,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (parsed && !error) {
                        value = parsed.years !== undefined
                            || parsed.months !== undefined
                            || parsed.weeks !== undefined
                            || parsed.days !== undefined
                            || parsed.hours !== undefined
                            || parsed.minutes !== undefined
                            || parsed.seconds !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.IsDate,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (parsed && !error) {
                        value = (parsed.month !== undefined && parsed.dayOfMonth !== undefined) || parsed.dayOfWeek !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.IsTimeRange,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (parsed && !error) {
                        value = parsed.partOfDay !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.IsDateRange,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (parsed && !error) {
                        value = (parsed.year !== undefined && parsed.dayOfMonth === undefined) ||
                            (parsed.year !== undefined && parsed.month !== undefined && parsed.dayOfMonth === undefined) ||
                            (parsed.month !== undefined && parsed.dayOfMonth === undefined) ||
                            parsed.season !== undefined || parsed.weekOfYear !== undefined || parsed.weekOfMonth !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.IsPresent,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let parsed: TimexProperty;
                    let value = false;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        ({timexProperty: parsed, error: error} = FunctionUtils.parseTimexProperty(args[0]));
                    }

                    if (parsed && !error) {
                        value = parsed.now !== undefined;
                    }

                    return {value, error};
                },
                ReturnType.Boolean,
                FunctionUtils.validateUnary),

            new ExpressionEvaluator(
                ExpressionType.UriHost,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.uriHost(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriPath,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.uriPath(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriPathAndQuery,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.uriPathAndQuery(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriQuery,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.uriQuery(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriPort,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.uriPort(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.Number,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriScheme,
                (expr: Expression, state: any, options: Options): {value: any; error: string} => {
                    let value: any;
                    let error: string;
                    let args: any[];
                    ({args, error} = FunctionUtils.evaluateChildren(expr, state, options));
                    if (!error) {
                        if (typeof (args[0]) === 'string') {
                            ({value, error} = FunctionUtils.uriScheme(args[0]));
                        } else {
                            error = `${expr} cannot evaluate`;
                        }
                    }

                    return {value, error};
                },
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Float,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let error: string;
                        const value: number = parseFloat(args[0]);
                        if (!FunctionUtils.isNumber(value)) {
                            error = `parameter ${args[0]} is not a valid number string.`;
                        }

                        return {value, error};
                    }),
                ReturnType.Number, FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Int,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let error: string;
                        const value: number = parseInt(args[0], 10);
                        if (!FunctionUtils.isNumber(value)) {
                            error = `parameter ${args[0]} is not a valid number string.`;
                        }

                        return {value, error};
                    }),
                ReturnType.Number,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.String,
                FunctionUtils.apply((args: any[]): string => {
                    return JSON.stringify(args[0])
                        .replace(/(^\'*)/g, '')
                        .replace(/(\'*$)/g, '')
                        .replace(/(^\"*)/g, '')
                        .replace(/(\"*$)/g, '');
                }),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.FormatNumber,
                FunctionUtils.applyWithError(
                    args => {
                        let value: any = null;
                        let error: string;
                        let number = args[0];
                        let precision = args[1];
                        let locale = args.length > 2 ? args[2] : "en-us";
                        if (typeof number !== 'number') {
                            error = `formatNumber first argument ${number} must be a number`;
                        } else if (typeof precision !== 'number') {
                            error = `formatNumber second argument ${precision} must be a number`;
                        } else if (locale && typeof locale !== 'string') {
                            error = `formatNubmer third argument ${locale} is not a valid locale`;
                        } else {
                            // NOTE: Nodes toLocaleString and Intl do not work to localize unless a special version of node is used.
                            // TODO: In R10 we should try another package.  Numeral and d3-format have the basics, but no locale specific.  
                            // Numbro has locales, but is optimized for the browser.
                            value = number.toLocaleString(locale, {minimumFractionDigits: precision, maximumFractionDigits: precision});
                        }

                        return {value, error};
                    }),
                ReturnType.String,
                (expr: Expression): void => FunctionUtils.validateOrder(expr, [ReturnType.String], ReturnType.Number, ReturnType.Number)),
            new ExpressionEvaluator(
                ExpressionType.GetProperty,
                FunctionUtils.getProperty,
                ReturnType.Object,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, [ReturnType.String], ReturnType.Object)),
            new ExpressionEvaluator(
                ExpressionType.If,
                (expression: Expression, state: MemoryInterface, options: Options): {value: any; error: string} => FunctionUtils._if(expression, state, options),
                ReturnType.Object,
                (expr: Expression): void => FunctionUtils.validateArityAndAnyType(expr, 3, 3)),
            new ExpressionEvaluator(
                ExpressionType.Rand,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let error: string;
                        if (args[0] > args[1]) {
                            error = `Min value ${args[0]} cannot be greater than max value ${args[1]}.`;
                        }

                        const value: any = Math.floor(Math.random() * (Number(args[1]) - Number(args[0])) + Number(args[0]));

                        return {value, error};
                    },
                    FunctionUtils.verifyInteger),
                ReturnType.Number,
                FunctionUtils.validateBinaryNumber),
            new ExpressionEvaluator(ExpressionType.CreateArray, FunctionUtils.apply((args: any[]): any[] => Array.from(args)), ReturnType.Array),
            new ExpressionEvaluator(
                ExpressionType.Binary,
                FunctionUtils.apply((args: any[]): Uint8Array => this.toBinary(args[0]), FunctionUtils.verifyString),
                ReturnType.Object,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.DataUri,
                FunctionUtils.apply(
                    (args: Readonly<any>): string => 'data:text/plain;charset=utf-8;base64,'.concat(Buffer.from(args[0]).toString('base64')), FunctionUtils.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.DataUriToBinary,
                FunctionUtils.apply((args: Readonly<any>): Uint8Array => this.toBinary(args[0]), FunctionUtils.verifyString),
                ReturnType.Object,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.DataUriToString,
                FunctionUtils.apply((args: Readonly<any>): string => Buffer.from(args[0].slice(args[0].indexOf(',') + 1), 'base64').toString(), FunctionUtils.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriComponentToString,
                FunctionUtils.apply((args: Readonly<any>): string => decodeURIComponent(args[0]), FunctionUtils.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Base64,
                FunctionUtils.apply(
                    (args: Readonly<any>): string | Uint8Array => {
                        let result: string;
                        if (typeof args[0] === 'string') {
                            result = Buffer.from(args[0]).toString('base64');
                        }

                        if (args[0] instanceof Uint8Array) {
                            result = Buffer.from(args[0]).toString('base64');
                        }
                        return result;
                    }),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Base64ToBinary,
                FunctionUtils.apply(
                    (args: Readonly<any>): Uint8Array => {
                        const raw = atob(args[0].toString());
                        return this.toBinary(raw);
                    }, FunctionUtils.verifyString),
                ReturnType.Object,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Base64ToString,
                FunctionUtils.apply((args: Readonly<any>): string => Buffer.from(args[0], 'base64').toString(), FunctionUtils.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.UriComponent,
                FunctionUtils.apply((args: Readonly<any>): string => encodeURIComponent(args[0]), FunctionUtils.verifyString),
                ReturnType.String,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.First,
                FunctionUtils.apply(
                    (args: any[]): any => {
                        let first: any;
                        if (typeof args[0] === 'string' && args[0].length > 0) {
                            first = args[0][0];
                        }

                        if (Array.isArray(args[0]) && args[0].length > 0) {
                            first = FunctionUtils.accessIndex(args[0], 0).value;
                        }

                        return first;
                    }),
                ReturnType.Object,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Last,
                FunctionUtils.apply(
                    (args: any[]): any => {
                        let last: any;
                        if (typeof args[0] === 'string' && args[0].length > 0) {
                            last = args[0][args[0].length - 1];
                        }

                        if (Array.isArray(args[0]) && args[0].length > 0) {
                            last = FunctionUtils.accessIndex(args[0], args[0].length - 1).value;
                        }

                        return last;
                    }),
                ReturnType.Object,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(
                ExpressionType.Json,
                FunctionUtils.apply((args: any[]): any => JSON.parse(args[0].trim())),
                ReturnType.Object,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, undefined, ReturnType.String)),
            new ExpressionEvaluator(
                ExpressionType.AddProperty,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let error: string;
                        const temp: any = args[0];
                        const prop = String(args[1]);
                        if (prop in temp) {
                            error = `${prop} already exists`;
                        } else {
                            temp[String(args[1])] = args[2];
                        }

                        return {value: temp, error};
                    }),
                ReturnType.Object,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, undefined, ReturnType.Object, ReturnType.String, ReturnType.Object)),
            new ExpressionEvaluator(
                ExpressionType.SetProperty,
                FunctionUtils.apply(
                    (args: any[]): any => {
                        const temp: any = args[0];
                        temp[String(args[1])] = args[2];

                        return temp;
                    }),
                ReturnType.Object,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, undefined, ReturnType.Object, ReturnType.String, ReturnType.Object)),
            new ExpressionEvaluator(
                ExpressionType.RemoveProperty,
                FunctionUtils.apply(
                    (args: any[]): any => {
                        const temp: any = args[0];
                        delete temp[String(args[1])];

                        return temp;
                    }),
                ReturnType.Object,
                (expression: Expression): void => FunctionUtils.validateOrder(expression, undefined, ReturnType.Object, ReturnType.String)),
            new ExpressionEvaluator(
                ExpressionType.SetPathToValue,
                this.setPathToValue,
                ReturnType.Object,
                this.validateBinary),
            new ExpressionEvaluator(ExpressionType.Select, FunctionUtils.foreach, ReturnType.Array, FunctionUtils.validateForeach),
            new ExpressionEvaluator(ExpressionType.Foreach, FunctionUtils.foreach, ReturnType.Array, FunctionUtils.validateForeach),
            new ExpressionEvaluator(ExpressionType.Where, FunctionUtils.where, ReturnType.Array, FunctionUtils.validateWhere),

            //URI Parsing Functions
            new ExpressionEvaluator(ExpressionType.UriHost, FunctionUtils.applyWithError((args: Readonly<any>): any => this.uriHost(args[0]), FunctionUtils.verifyString),
                ReturnType.String, FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.UriPath, FunctionUtils.applyWithError((args: Readonly<any>): any => this.uriPath(args[0]), FunctionUtils.verifyString),
                ReturnType.String, FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.UriPathAndQuery,
                FunctionUtils.applyWithError((args: Readonly<any>): any => this.uriPathAndQuery(args[0]), FunctionUtils.verifyString),
                ReturnType.String, FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.UriQuery, FunctionUtils.applyWithError((args: Readonly<any>): any => this.uriQuery(args[0]), FunctionUtils.verifyString),
                ReturnType.String, FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.UriPort, FunctionUtils.applyWithError((args: Readonly<any>): any => this.uriPort(args[0]), FunctionUtils.verifyString),
                ReturnType.String, FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.UriScheme, FunctionUtils.applyWithError((args: Readonly<any>): any => this.uriScheme(args[0]), FunctionUtils.verifyString),
                ReturnType.String, FunctionUtils.validateUnary),

            new ExpressionEvaluator(ExpressionType.Coalesce, FunctionUtils.apply((args: any[][]): any => this.coalesce(args as any[])),
                ReturnType.Object, FunctionUtils.validateAtLeastOne),
            new ExpressionEvaluator(ExpressionType.JPath, FunctionUtils.applyWithError((args: any[][]): any => this.jPath(args[0], args[1].toString())),
                ReturnType.Object, (expr: Expression): void => FunctionUtils.validateOrder(expr, undefined, ReturnType.Object, ReturnType.String)),
            new ExpressionEvaluator(ExpressionType.Merge, 
                FunctionUtils.applySequenceWithError(
                    (args: any[]): any => {
                        let value: any;
                        let error: string;
                        if ((typeof(args[0]) === 'object' && !Array.isArray(args[0])) && (typeof(args[1]) === 'object' && !Array.isArray(args[1]))) {
                            Object.assign(args[0], args[1]);
                            value = args[0];
                        } else {
                            error = `The argumets ${ args[0] } and ${ args[1] } must be JSON objects.`;
                        }

                        return {value, error};
                    }),
                ReturnType.Object, 
                (expression: Expression): void => FunctionUtils.validateArityAndAnyType(expression, 2, Number.MAX_SAFE_INTEGER)),

            // Regex expression functions
            new ExpressionEvaluator(
                ExpressionType.IsMatch,
                FunctionUtils.applyWithError(
                    (args: any[]): any => {
                        let value = false;
                        let error: string;
                        if (args[0] === undefined || args[0] === '') {
                            value = false;
                            error = 'regular expression is empty.';
                        } else {
                            const regex: RegExp = CommonRegex.CreateRegex(args[1].toString());
                            value = regex.test(args[0].toString());
                        }

                        return {value, error};
                    }, FunctionUtils.verifyStringOrNull),
                ReturnType.Boolean,
                FunctionUtils.validateIsMatch),

            // Type Checking Functions
            new ExpressionEvaluator(ExpressionType.isString, FunctionUtils.apply(
                (args: any[]): boolean => typeof args[0] === 'string'),
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.isInteger, FunctionUtils.apply(
                (args: any[]): boolean => this.isNumber(args[0]) && Number.isInteger(args[0])),
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.isFloat, FunctionUtils.apply(
                (args: any[]): boolean => this.isNumber(args[0]) && !Number.isInteger(args[0])),
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.isArray, FunctionUtils.apply(
                (args: any[]): boolean => Array.isArray(args[0])),
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.isObject, FunctionUtils.apply(
                (args: any[]): boolean => typeof args[0] === 'object'),
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.isBoolean, FunctionUtils.apply(
                (args: any[]): boolean => typeof args[0] === 'boolean'),
                ReturnType.Boolean,
                FunctionUtils.validateUnary),
            new ExpressionEvaluator(ExpressionType.isDateTime, FunctionUtils.apply(
                (args: any[]): boolean => typeof args[0] === 'string' && this.verifyISOTimestamp(args[0]) === undefined),
                ReturnType.Boolean,
                FunctionUtils.validateUnary)
        ];

        const lookup: Map<string, ExpressionEvaluator> = new Map<string, ExpressionEvaluator>();
        functions.forEach((func: ExpressionEvaluator): void => {
            lookup.set(func.type, func);
        });

        // Math aliases
        lookup.set('add', lookup.get(ExpressionType.Add)); // more than 1 param
        lookup.set('mul', lookup.get(ExpressionType.Multiply)); // more than 1 param
        lookup.set('div', lookup.get(ExpressionType.Divide)); // more than 1 param
        lookup.set('sub', lookup.get(ExpressionType.Subtract)); // more than 1 param
        lookup.set('exp', lookup.get(ExpressionType.Power)); // more than 1 param
        lookup.set('mod', lookup.get(ExpressionType.Mod));

        // Comparison aliases
        lookup.set('and', lookup.get(ExpressionType.And));
        lookup.set('equals', lookup.get(ExpressionType.Equal));
        lookup.set('greater', lookup.get(ExpressionType.GreaterThan));
        lookup.set('greaterOrEquals', lookup.get(ExpressionType.GreaterThanOrEqual));
        lookup.set('less', lookup.get(ExpressionType.LessThan));
        lookup.set('lessOrEquals', lookup.get(ExpressionType.LessThanOrEqual));
        lookup.set('not', lookup.get(ExpressionType.Not));
        lookup.set('or', lookup.get(ExpressionType.Or));
        lookup.set('&', lookup.get(ExpressionType.Concat));

        return lookup as ReadonlyMap<string, ExpressionEvaluator>;
    }
}
