/* 6502 assembler */

export class Assembler {
    org: number;
    pass: number;
    current_address: number;
    labels: Object = {};
    op_codes = {
        'ADC': {
            'Immediate': [0x69, 2, 2],
            'Zero Page': [0x65, 2, 3],
            'Zero Page,X': [0x75, 2, 4],
            'Absolute': [0x6D, 3, 4],
            'Absolute,X': [0x7D, 3, '4+'],
            'Absolute,Y': [0x79, 3, '4+'],
            'Indirect,X': [0x61, 2, 6],
            'Indirect,Y': [0x71, 2, '5+']
        },
        'AND': {
            'Immediate': [0x29, 2, 2],
            'Zero Page': [0x25, 2, 3],
            'Zero Page,X': [0x35, 2, 4],
            'Absolute': [0x2D, 3, 4],
            'Absolute,X': [0x3D, 3, '4+'],
            'Absolute,Y': [0x39, 3, '4+'],
            'Indirect,X': [0x21, 2, 6],
            'Indirect,Y': [0x31, 2, '5+'],
        },
        'ASL': {
            'Accumulator': [0x0A, 1, 2],
            'Zero Page': [0x06, 2, 5],
            'Zero Page,X': [0x16, 2, 6],
            'Absolute': [0x0E, 3, 6],
            'Absolute,X': [0x1E, 3, 7]
        },
        'BIT': {
            'Zero Page': [0x24, 2, 3],
            'Absolute': [0x2C, 3, 4]
        },
        'BPL': {'Relative': [0x10, 2, 2]},
        'BMI': {'Relative': [0x30, 2, 2]},
        'BVC': {'Relative': [0x50, 2, 2]},
        'BVS': {'Relative': [0x70, 2, 2]},
        'BCC': {'Relative': [0x90, 2, 2]},
        'BCS': {'Relative': [0xB0, 2, 2]},
        'BNE': {'Relative': [0xD0, 2, 2]},
        'BEQ': {'Relative': [0xF0, 2, 2]},

        'BRK': {'Implied': [0x00, 1, 7]},
        'CMP': {
            'Immediate': [0xC9, 2, 2],
            'Zero Page': [0xC5, 2, 3],
            'Zero Page,X': [0xD5, 2, 4],
            'Absolute': [0xCD, 3, 4],
            'Absolute,X': [0xDD, 3, '4+'],
            'Absolute,Y': [0xD9, 3, '4+'],
            'Indirect,X': [0xC1, 2, 6],
            'Indirect,Y': [0xD1, 2, '5+']
        },

        'CPX': {
            'Immediate': [0xE0, 2, 2],
            'Zero Page': [0xE4, 2, 3],
            'Absolute': [0xEC, 3, 4]
        },
        'CPY': {
            'Immediate': [0xC0, 2, 2],
            'Zero Page': [0xC4, 2, 3],
            'Absolute': [0xCC, 3, 4]
        },
        'DEC': {
            'Zero Page': [0xC6, 2, 5],
            'Zero Page,X': [0xD6, 2, 6],
            'Absolute': [0xCE, 3, 6],
            'Absolute,X': [0xDE, 3, 7]
        },
        'EOR': {
            'Immediate': [0x49, 2, 2],
            'Zero Page': [0x45, 2, 3],
            'Zero Page,X': [0x55, 2, 4],
            'Absolute': [0x4D, 3, 4],
            'Absolute,X': [0x5D, 3, '4+'],
            'Absolute,Y': [0x59, 3, '4+'],
            'Indirect,X': [0x41, 2, 6],
            'Indirect,Y': [0x51, 2, '5+']
        },
        'CLC': {'Implied': [0x18, 1, 2]},
        'SEC': {'Implied': [0x38, 1, 2]},
        'CLI': {'Implied': [0x58, 1, 2]},
        'SEI': {'Implied': [0x78, 1, 2]},
        'CLV': {'Implied': [0xB8, 1, 2]},
        'CLD': {'Implied': [0xD8, 1, 2]},
        'SED': {'Implied': [0xF8, 1, 2]},
        'INC': {
            'Zero Page': [0xE6, 2, 5],
            'Zero Page,X': [0xF6, 2, 6],
            'Absolute': [0xEE, 3, 6],
            'Absolute,X': [0xFE, 3, 7]
        },
        'JMP': {
            'Absolute': [0x4C, 3, 3],
            'Indirect': [0x6C, 3, 5]
        },
        'JSR': {'Absolute': [0x20, 3, 6]},
        'LDA': {
            'Immediate': [0xA9, 2, 2],
            'Zero Page': [0xA5, 2, 3],
            'Zero Page,X': [0xB5, 2, 4],
            'Absolute': [0xAD, 3, 4],
            'Absolute,X': [0xBD, 3, '4+'],
            'Absolute,Y': [0xB9, 3, '4+'],
            'Indirect,X': [0xA1, 2, 6],
            'Indirect,Y': [0xB1, 2, '5+']
        },
        'LDX': {
            'Immediate': [0xA2, 2, 2],
            'Zero Page': [0xA6, 2, 3],
            'Zero Page,Y': [0xB6, 2, 4],
            'Absolute': [0xAE, 3, 4],
            'Absolute,Y': [0xBE, 3, '4+']
        },
        'LDY': {
            'Immediate': [0xA0, 2, 2],
            'Zero Page': [0xA4, 2, 3],
            'Zero Page,X': [0xB4, 2, 4],
            'Absolute': [0xAC, 3, 4],
            'Absolute,X': [0xBC, 3, '4+']
        },
        'LSR': {
            'Accumulator': [0x4A, 1, 2],
            'Zero Page': [0x46, 2, 5],
            'Zero Page,X': [0x56, 2, 6],
            'Absolute': [0x4E, 3, 6],
            'Absolute,X': [0x5E, 3, 7]
        },
        'NOP': {'Implied': [0xEA, 1, 2] },
        'ORA': {
            'Immediate': [0x09, 2, 2],
            'Zero Page': [0x05, 2, 3],
            'Zero Page,X': [0x15, 2, 4],
            'Absolute': [0x0D, 3, 4],
            'Absolute,X': [0x1D, 3, '4+'],
            'Absolute,Y': [0x19, 3, '4+'],
            'Indirect,X': [0x01, 2, 6],
            'Indirect,Y': [0x11, 2, '5+']
        },
        'TAX': {'Implied': [0xAA, 1, 2]},
        'TXA': {'Implied': [0x8A, 1, 2]},
        'DEX': {'Implied': [0xCA, 1, 2]},
        'INX': {'Implied': [0xE8, 1, 2]},
        'TAY': {'Implied': [0xA8, 1, 2]},
        'TYA': {'Implied': [0x98, 1, 2]},
        'DEY': {'Implied': [0x88, 1, 2]},
        'INY': {'Implied': [0xC8, 1, 2]},

        'ROL': {
            'Accumulator': [0x2A, 1, 2],
            'Zero Page': [0x26, 2, 5],
            'Zero Page,X': [0x36, 2, 6],
            'Absolute': [0x2E, 3, 6],
            'Absolute,X': [0x3E, 3, 7]
        },
        'ROR': {
            'Accumulator': [0x6A, 1, 2],
            'Zero Page': [0x66, 2, 5],
            'Zero Page,X': [0x76, 2, 6],
            'Absolute': [0x6E, 3, 6],
            'Absolute,X': [0x7E, 3, 7]
        },
        'RTI': {'Implied': [0x40, 1, 6]},
        'RTS': {'Implied': [0x60, 1, 6]},

        'SBC': {
            'Immediate': [0xE9, 2, 2],
            'Zero Page': [0xE5, 2, 3],
            'Zero Page,X': [0xF5, 2, 4],
            'Absolute': [0xED, 3, 4],
            'Absolute,X': [0xFD, 3, '4+'],
            'Absolute,Y': [0xF9, 3, '4+'],
            'Indirect,X': [0xE1, 2, 6],
            'Indirect,Y': [0xF1, 2, '5+']
        },
        'STA': {
            'Zero Page': [0x85, 2, 3],
            'Zero Page,X': [0x95, 2, 4],
            'Absolute': [0x8D, 3, 4],
            'Absolute,X': [0x9D, 3, 5],
            'Absolute,Y': [0x99, 3, 5],
            'Indirect,X': [0x81, 2, 6],
            'Indirect,Y': [0x91, 2, 6]
        },
        'TXS': {'Implied': [0x9A, 1, 2]},
        'TSX': {'Implied': [0xBA, 1, 2]},
        'PHA': {'Implied': [0x48, 1, 3]},
        'PLA': {'Implied': [0x68, 1, 4]},
        'PHP': {'Implied': [0x08, 1, 3]},
        'PLP': {'Implied': [0x28, 1, 2]},

        'STX': {
            'Zero Page': [0x86, 2, 3],
            'Zero Page,Y': [0x96, 2, 4],
            'Absolute': [0x8E, 3, 4],
        },
        'STY': {
            'Zero Page': [0x84, 2, 3],
            'Zero Page,X': [0x94, 2, 4],
            'Absolute': [0x8C, 3, 4]
        }
    }
    constructor() { }

    invertOps() {
        const opcodes = {};

        Object.keys(this.op_codes).forEach( op_code => {
            const code = this.op_codes[op_code];
            Object.keys(code).forEach( address_mode => {
                opcodes[code[address_mode][0]] = [op_code, address_mode, code[address_mode][1], code[address_mode][2]];
            });
        });
        return opcodes;
    }

    evaluateLine(line: string): number {
        const operators = /[\+\-\*\/\&\|\^\<\>]/;
        const chunks = line.split(operators);
        let chunk_len = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        chunk_len += (chunks.length - 1);

        if (chunk_len !== line.length) {
            return 0;
        }
        // now get the operators
        let line_index = 0;
        const operators_used = [];
        for (let i = 0; i < chunks.length - 1; i++) {
            line_index += chunks[i].length;
            operators_used.push(line.charAt(line_index));
            line_index++;
        }
        let total = 0;
        let operator = '';
        for (let i = 0; i < chunks.length; i++) {
            const acc = this.parseNum(chunks[i]);
            switch (operator) {
                case '':
                case '+':
                    total += acc;
                    break;
                case '-':
                    total -= acc;
                    if (total < 0) {
                        total = (total + 65536);
                    }
                    break;
                case '*':
                    total *= acc;
                    break;
                case '<':
                    total += acc & 0xff;
                    break;
                case '>':
                    total += (acc >> 8) & 0xff;
                    break;
                case '/':
                    total /= acc;
                    break;
                case '&':
                    total &= acc;
                    break;
                case '|':
                    total |= acc;
                    break;
                case '^':
                    if (i === 0) {
                        total = 0xFFFF ^ acc;
                    } else {
                        total ^= acc;
                    }
                    break;
            }
            total &= 0xffff;
            operator = operators_used[i];
        }
        return total;
    }

    parseNum(line: string) {
        if (line.charAt(0) === '$') {
            return parseInt(line.substr(1), 16);
        } else if (line.charAt(0) === '%') {
            return parseInt(line.substr(1), 2);
        } else if (line.match(/^\d+$/)) {
            return parseInt(line, 10);
        }
        if (this.labels.hasOwnProperty(line)) {
            return this.labels[line];
        }
        return 0xffff;
    }

    parseAddressMode(line: string, pass: number, op_code: Object): Array<any> {
        // immediate mode
        let val;
        if (!line) {
            return ['Accumulator'];
        }
        line = line.replace(/ /g, '');
        if (line.toUpperCase() === 'A') {
            return ['Accumulator'];
        }
        if (line.charAt(0) === '#') {
            return ['Immediate', this.evaluateLine(line.substr(1))];
        } else if (line.charAt(0) === '(') {
            if (line.substr(line.length - 3).toUpperCase() === '),Y') {
                val = this.evaluateLine(line.substr(1, line.length - 4));
                return ['Indirect,Y', val & 0xff];
            }
            if (line.substr(line.length - 3).toUpperCase() === ',X)') {
                val = this.evaluateLine(line.substr(1, line.length - 4));
                return ['Indirect,X', val & 0xff];
            }
            if (line.charAt(line.length - 1) === ')') {
                val = this.evaluateLine(line.substr(1, line.length - 2))
                return ['Indirect', val & 0xff, ((val >> 8) & 0xff)];
            }
        } else if (line.substr(line.length - 2).toUpperCase() === ',X') {
            val = this.evaluateLine(line.substr(0, line.length - 2));
            if ((val > 0xff) ||  !op_code.hasOwnProperty('Zero Page,X')) {
                return ['Absolute,X', val & 0xff, ((val >> 8) & 0xff) ];
            } else {
                return ['Zero Page,X', val & 0xff ];
            }
        } else if (line.substr(line.length - 2).toUpperCase() === ',Y') {
            val = this.evaluateLine(line.substr(0, line.length - 2))
            if ((val > 0xff) || !op_code.hasOwnProperty('Zero Page,Y')) {
                return ['Absolute,Y', val & 0xff, ((val >> 8) & 0xff) ];
            } else {
                return ['Zero Page,Y', val & 0xff ];
            }
        } else {
            val = this.evaluateLine(line);
            if ((val > 0xff) || !op_code.hasOwnProperty('Zero Page')) {
                return ['Absolute', val & 0xff, ((val >> 8) & 0xff) ];
            } else {
                return ['Zero Page', val & 0xff ];
            }
        }
    }

    handleSpecial(chunk: string, chunks: Array<string>): Array<number> {
        const  bytes: Array<number> = [];
        if (chunk.toUpperCase() === '.DB') {
            chunks.join('').split(',').forEach(ch => {
                bytes.push(this.evaluateLine(ch));
            })
        } else if (chunk.toUpperCase() === '.DW') {
            chunks.join('').split(',').forEach(ch => {
                const word = this.evaluateLine(ch);
                bytes.push(word & 0xff);
                bytes.push((word >> 8) & 0xff);
            })
        } else if (chunk.toUpperCase() === '.ORG') {
            this.org = this.current_address = this.evaluateLine(chunks.shift());
        } else {
            console.log('I dont know how do do: ' + chunk);
        }
        return bytes;
    }
    handleRegular(line: string, chunk: string, chunks: Array<string>, pass: number): Array<number> {
        const bytes: Array<number> = [];
        let op_code: Object;
        let instruction: string;
        let address_mode: Array<string | number>;
        let address_mode_string: string;

        if (this.op_codes.hasOwnProperty(chunk.toUpperCase())) {
            instruction = chunk.toUpperCase();
            op_code = this.op_codes[instruction];
            chunk = chunks.shift();
            if (op_code.hasOwnProperty('Implied')) {
                bytes.push(op_code['Implied'][0]);
//                return bytes;
            } else {
                if (op_code.hasOwnProperty('Relative')) {
                    address_mode_string = 'Relative';
                    bytes.push(op_code[address_mode_string][0]);
                    let relative_address = this.evaluateLine(chunk) - (this.current_address + 2)
                    if (relative_address < 0) {
                        relative_address += 65536;
                    }
                    bytes.push( relative_address & 0xff );
//                    return bytes;
                } else {
                    address_mode = this.parseAddressMode(chunk, pass, op_code);
                    address_mode_string = '';
                    if (op_code.hasOwnProperty(address_mode[0])) {
                        address_mode_string = <string>address_mode[0];
                        bytes.push(op_code[ address_mode_string ][0]);
                        address_mode.shift();
                        while (address_mode.length) {
                            bytes.push(<number>address_mode.shift());
                        }
//                        return bytes;
                    } else {
                        console.log('I cant parse this address mode: ' + instruction + ' ' + address_mode[0] + '[ ' + line + ' ]');
                    }
                }
            }
        } else {
            console.log('I dont know how to do ' + line);
        }
        return bytes;
    }

    assembleLine(line: string, pass: number): Array<number> {
        line = line.trim();
        const bytes: Array<number> = [];
// remove any comments
        const linex = line.split(';', 1)[0];
        if (linex.length === 0) {
            return bytes;
        }
        const chunks = linex.split(/\s+/);
// look for simple defines
        if ((chunks.length > 2) && (chunks[1] === '=')) {
            this.labels[chunks[0]] = this.evaluateLine(chunks.slice(2).join(''));
            return bytes;
        }
        let chunk: string;

        if (chunks[0].endsWith(':')) {
            this.labels[chunks[0].substr(0, chunks[0].length - 1)] = this.current_address;
            chunks.shift();
        }
        if (chunks.length > 0) {
            chunk = chunks.shift();
            const first_char = chunk.charAt(0);
            if (first_char === ';') {
                return bytes;
            } else if (first_char === '.') {
                return this.handleSpecial(chunk, chunks);
            } else {
                return this.handleRegular(line, chunk, chunks, pass);
            }
        }
        return bytes;
    }

    dumpLabels() {
        Object.keys(this.labels).sort().forEach(label =>
            console.log(label + ':' + this.labels[label])
        );
    }

    assemble(lines: Array<string>) {
        this.pass = 0;
        this.current_address = 0;
        let memory = [];
        this.labels = {};

        for (let i = 0; i < lines.length; i++ ) {
            const bytes = this.assembleLine(lines[i], 0);
            this.current_address += bytes.length;
        }
        this.current_address = 0;
        memory = [];
        for (let i = 0; i < lines.length; i++ ) {
/*            if ((memory.length > 3600) && (memory.length < 3611))
            {
                console.log(memory.length + ': ' + lines[i]);
            }  */
            const bytes = this.assembleLine(lines[i], 1);
            if (bytes.length) {
                this.current_address += bytes.length;
                memory = memory.concat(bytes);
            }
        }
        console.log(this.labels['PPU_CTRL_REG1']);

//        this.dumpLabels();
        return memory;
    }
}

