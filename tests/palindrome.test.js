const {palindrome} = require('../utils/for_testing')

test('palindrome of miguel', () => {
    const result = palindrome('miguel')

    expect(result).toBe('leugi')
})