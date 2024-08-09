import { ValidationArguments } from 'class-validator';

export const lengthValidationMessage = (args: ValidationArguments) => {
  /**
   * Properties of validationArguments:
   *
   * 1) value -> The value being validated (the inputted value)
   * 2) constraints -> The constraints provided in the decorator parameters
   *    args.constraints[0] -> 1
   *    args.constraints[1] -> 20
   */

  if (args.constraints.length === 2) {
    return `${args.property} should be between ${args.constraints[0]} and ${args.constraints[1]} characters.`;
  } else {
    return `${args.property}는 최소  ${args.constraints[0]} .`;
  }
};
