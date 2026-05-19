import { str, num, bool, url, port, email, json, enums } from '../src/validators'

// ---------------------------------------------------------------------------
// str
// ---------------------------------------------------------------------------
describe('str()', () => {
  it('parses a plain string', () => {
    const spec = str()
    expect(spec._parse('hello', 'VAR')).toBe('hello')
  })

  it('applies choices constraint', () => {
    const spec = str({ choices: ['a', 'b'] })
    expect(spec._parse('a', 'VAR')).toBe('a')
    expect(() => {
      const v = spec._parse('c', 'VAR')
      spec._validate(v, 'VAR')
    }).toThrow('must be one of')
  })

  it('applies minLength', () => {
    const spec = str({ minLength: 3 })
    expect(() => {
      const v = spec._parse('ab', 'VAR')
      spec._validate(v, 'VAR')
    }).toThrow('at least 3')
  })

  it('applies maxLength', () => {
    const spec = str({ maxLength: 3 })
    expect(() => {
      const v = spec._parse('abcd', 'VAR')
      spec._validate(v, 'VAR')
    }).toThrow('at most 3')
  })

  it('applies pattern', () => {
    const spec = str({ pattern: /^\d+$/ })
    expect(spec._parse('123', 'VAR')).toBe('123')
    expect(() => {
      const v = spec._parse('abc', 'VAR')
      spec._validate(v, 'VAR')
    }).toThrow('must match pattern')
  })

  it('marks as required when no default', () => {
    expect(str()._required).toBe(true)
  })

  it('marks as optional when default is provided', () => {
    expect(str({ default: 'x' })._required).toBe(false)
  })

  it('carries secret flag', () => {
    expect(str({ secret: true })._secret).toBe(true)
  })

  it('carries description', () => {
    expect(str({ description: 'API key' })._description).toBe('API key')
  })
})

// ---------------------------------------------------------------------------
// num
// ---------------------------------------------------------------------------
describe('num()', () => {
  it('parses an integer string', () => {
    expect(num()._parse('42', 'VAR')).toBe(42)
  })

  it('parses a float string', () => {
    expect(num()._parse('3.14', 'VAR')).toBeCloseTo(3.14)
  })

  it('throws on non-numeric input', () => {
    expect(() => num()._parse('abc', 'VAR')).toThrow('finite number')
  })

  it('throws on Infinity', () => {
    expect(() => num()._parse('Infinity', 'VAR')).toThrow('finite number')
  })

  it('applies min constraint', () => {
    const spec = num({ min: 5 })
    expect(() => {
      const v = spec._parse('3', 'VAR')
      spec._validate(v, 'VAR')
    }).toThrow('>= 5')
  })

  it('applies max constraint', () => {
    const spec = num({ max: 10 })
    expect(() => {
      const v = spec._parse('11', 'VAR')
      spec._validate(v, 'VAR')
    }).toThrow('<= 10')
  })

  it('marks as required when no default', () => {
    expect(num()._required).toBe(true)
  })

  it('uses default', () => {
    expect(num({ default: 99 })._default).toBe(99)
  })
})

// ---------------------------------------------------------------------------
// bool
// ---------------------------------------------------------------------------
describe('bool()', () => {
  const spec = bool()

  it.each([['true'], ['1'], ['yes'], ['on'], ['TRUE'], ['YES']])(
    'parses truthy value %s',
    (val) => {
      expect(spec._parse(val, 'VAR')).toBe(true)
    },
  )

  it.each([['false'], ['0'], ['no'], ['off'], ['FALSE'], ['NO']])(
    'parses falsy value %s',
    (val) => {
      expect(spec._parse(val, 'VAR')).toBe(false)
    },
  )

  it('throws on invalid value', () => {
    expect(() => spec._parse('maybe', 'VAR')).toThrow('boolean')
  })

  it('uses default false', () => {
    expect(bool({ default: false })._default).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// url
// ---------------------------------------------------------------------------
describe('url()', () => {
  it('accepts a valid URL', () => {
    expect(url()._parse('https://example.com', 'VAR')).toBe('https://example.com')
  })

  it('rejects an invalid URL', () => {
    expect(() => url()._parse('not-a-url', 'VAR')).toThrow('valid URL')
  })

  it('enforces protocol restriction', () => {
    const spec = url({ protocols: ['https:'] })
    expect(() => spec._parse('http://example.com', 'VAR')).toThrow('protocol must be one of')
  })

  it('allows matching protocol', () => {
    const spec = url({ protocols: ['https:', 'http:'] })
    expect(spec._parse('http://example.com', 'VAR')).toBe('http://example.com')
  })
})

// ---------------------------------------------------------------------------
// port
// ---------------------------------------------------------------------------
describe('port()', () => {
  it('accepts a valid port', () => {
    expect(port()._parse('3000', 'VAR')).toBe(3000)
  })

  it('rejects 0', () => {
    expect(() => port()._parse('0', 'VAR')).toThrow('between 1 and 65535')
  })

  it('rejects 65536', () => {
    expect(() => port()._parse('65536', 'VAR')).toThrow('between 1 and 65535')
  })

  it('rejects non-integer', () => {
    expect(() => port()._parse('abc', 'VAR')).toThrow('integer')
  })

  it('rejects float', () => {
    expect(() => port()._parse('3000.5', 'VAR')).toThrow('integer')
  })

  it('accepts boundary values', () => {
    expect(port()._parse('1', 'VAR')).toBe(1)
    expect(port()._parse('65535', 'VAR')).toBe(65535)
  })
})

// ---------------------------------------------------------------------------
// email
// ---------------------------------------------------------------------------
describe('email()', () => {
  it('accepts a valid email', () => {
    expect(email()._parse('user@example.com', 'VAR')).toBe('user@example.com')
  })

  it('rejects missing @', () => {
    expect(() => email()._parse('notanemail', 'VAR')).toThrow('valid email')
  })

  it('rejects missing TLD', () => {
    expect(() => email()._parse('user@host', 'VAR')).toThrow('valid email')
  })

  it('accepts subdomain emails', () => {
    expect(email()._parse('user@mail.example.co.uk', 'VAR')).toBe('user@mail.example.co.uk')
  })
})

// ---------------------------------------------------------------------------
// json
// ---------------------------------------------------------------------------
describe('json()', () => {
  it('parses a JSON object', () => {
    expect(json()._parse('{"a":1}', 'VAR')).toEqual({ a: 1 })
  })

  it('parses a JSON array', () => {
    expect(json()._parse('[1,2,3]', 'VAR')).toEqual([1, 2, 3])
  })

  it('throws on invalid JSON', () => {
    expect(() => json()._parse('{bad}', 'VAR')).toThrow('valid JSON')
  })
})

// ---------------------------------------------------------------------------
// enums
// ---------------------------------------------------------------------------
describe('enums()', () => {
  const spec = enums(['a', 'b', 'c'] as const)

  it('accepts valid enum value', () => {
    expect(spec._parse('a', 'VAR')).toBe('a')
  })

  it('rejects invalid enum value', () => {
    expect(() => spec._parse('d', 'VAR')).toThrow('must be one of')
  })

  it('carries default', () => {
    const s = enums(['x', 'y'] as const, { default: 'x' })
    expect(s._default).toBe('x')
    expect(s._required).toBe(false)
  })
})
