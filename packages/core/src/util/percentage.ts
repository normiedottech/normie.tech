export const removePercentageFromNumber = (num: number,percentage: number) => {
   return num * (100-percentage) / 100
}