
/* 6502 emulator */

export class Emulator {

    labels_by_val = {};
    tv_system = 'PAL'
    scanline = 0
    cpu_cycles_per_scanline = {
      NTSC: 106.56,
      PAL: 113.33
    }
    scanlines_per_frame = {
      NTSC: 262,
      PAL: 312
    }
    frames_per_second = {
      NTSC: 60,
      PAL: 50
    }
    cpu_cycles_per_frame = {
      NTSC: 262 * 106.56,
      PAL: 312 * 113.33
    }

    PPU_CTRL_REG1         = 0x2000;
    PPU_CTRL_REG2         = 0x2001;
    PPU_STATUS            = 0x2002;
    PPU_SPR_ADDR          = 0x2003;
    PPU_SPR_DATA          = 0x2004;
    PPU_SCROLL_REG        = 0x2005;
    PPU_ADDRESS           = 0x2006;
    PPU_DATA              = 0x2007;

    SND_REGISTER          = 0x4000;
    SND_SQUARE1_REG       = 0x4000;
    SND_SQUARE2_REG       = 0x4004;
    SND_TRIANGLE_REG      = 0x4008;
    SND_NOISE_REG         = 0x400c;
    SND_DELTA_REG         = 0x4010;
    SND_MASTERCTRL_REG    = 0x4015;

    SPR_DMA               = 0x4014;
    JOYPAD_PORT           = 0x4016;
    JOYPAD_PORT1          = 0x4016;
    JOYPAD_PORT2          = 0x4017;

    memory: Uint8ClampedArray = new Uint8ClampedArray(32768);
    flags = {
        C: 0,
        Z: 0,
        I: 0,
        D: 0,
        B: 0,
        V: 0,
        N: 0
    }
    C = 1;
    Z = 2;
    I = 4;
    D = 8;
    B = 0x10;
    V = 0x40;
    N = 0x80;
    regs = {
        A: 0,
        X: 0,
        Y: 0,
        SR: 0,  // flags
        SP: 0,
        PC: 0
    }
    clk = 0;
    steps = 0;
    org = 0;
    constructor(private program_code: Uint8ClampedArray,
        private  chr_rom: Uint8ClampedArray,
        private  op_codes: Object,
        private program_origin: number,
        private labels: object
    ) {
        this.org = program_origin;
        Object.keys(this.labels).forEach(label => this.labels_by_val[this.labels[label]] = label);
    }

    reset() {
        this.CLI();
        this.regs.PC = this.LOAD16(0xFFFC);
    }

    stepHardWare() {
  //      this.PPU_STATUS = 0x80;
        if (this.steps > 100) {
            this.memory[this.PPU_STATUS] |= 0x80;
        }
    }

    hex8(num: number) {
        let ret = num.toString(16).toUpperCase();
        while (ret.length < 2) {
            ret = '0' + ret;
        }
        ret = '$' + ret;
        return ret;
    }

    hex16(num: number) {
        let ret: string;
        if (this.labels_by_val.hasOwnProperty(num)) {
            ret = this.labels_by_val[num];
        } else {
            ret = num.toString(16).toUpperCase();
            while (ret.length < 2) {
                ret = '0' + ret;
            }
            ret = '$' + ret;
        }
        return ret;
    }

    displayAddress(address_mode: string, addresses: Array<any>): string {
        let address = '';
        switch (address_mode) {
            case 'Implied':
            break;
        case 'Immediate':
            address = '#' + this.hex8(addresses[2]);
            break;
        case 'Accumulator':
            address = 'A';
            break;
        case 'Zero Page':
            address = this.hex8(addresses[2]);
            break;
        case 'Zero Page,X':
            address = this.hex8(addresses[2]) + ',X';
            break;
        case 'Zero Page,Y':
            address = this.hex8(addresses[2]) + ',X';
            break;
        case 'Indirect,X':
            address = '(' + this.hex8(addresses[2]) + ',X)';
            break;
        case 'Indirect,Y':
            address = '(' + this.hex8(addresses[2]) + '),Y';
            break;
        case 'Absolute':
            address = this.hex16(addresses[2]);
            break;
        case 'Absolute,X':
            address = this.hex16(addresses[2]) + ',X';
            break;
        case 'Absolute,Y':
            address = this.hex16(addresses[2]) + ',Y';
            break;
        case 'Relative':
            address = this.hex16(addresses[0])
            break;
        case 'Indirect':
            address = '(' + this.hex16(addresses[2]) + ')';
            break;
        default:
            console.log('I dont know this address mode: ' + address_mode);
            break;
        }
        return address;
    }

    step() {
        const instruction = this.LOAD(this.regs.PC);
        const op_code = this.op_codes.hasOwnProperty(instruction) ? this.op_codes[instruction] : null;
        if (op_code) {
            let pc: string;
            let target: string;
            let addresses = [];
            const x = op_code;
            this.clk += op_code[3];
            addresses = this.decodeAddress(op_code[1], op_code[2]);
            if (this.labels_by_val.hasOwnProperty(this.regs.PC)) {
                pc = this.labels_by_val[this.regs.PC];
            } else {
                pc = this.regs.PC.toString(16);
            }
            const display_address = this.displayAddress(op_code[1], addresses);
            if (this.labels_by_val.hasOwnProperty(addresses[2])) {
                target = this.labels_by_val[addresses[2]];
            } else {
                target = addresses[2].toString(16);
            }
            console.log(pc + ': ' + op_code[0] + ' ' + display_address);
            this.regs.PC += op_code[2];
            this[op_code[0]](addresses[0], addresses[1]);
        } else {
            console.log('Error!');
        }
        this.steps++;
    }

    decodeAddress(address_mode: string, length: number) {
        let source: number = -1;
        let target: number | string = -1;
        let param: number = -1;
        if (length === 2) {
            param = this.LOAD(this.regs.PC + 1);
        } else if (length === 3) {
            param = this.LOAD16(this.regs.PC + 1)
        }
        switch (address_mode) {
            case 'Implied':
                break;
            case 'Immediate':
                source = param;
                break;
            case 'Accumulator':
                source = this.regs.A;
                target = 'Accumulator';
                break;
            case 'Zero Page':
                target = param = this.LOAD(this.regs.PC + 1)
                source = this.LOAD(target);
                break;
            case 'Zero Page,X':
                target = (param + this.regs.X) & 0xFF;
                source = this.LOAD(target);
                break;
            case 'Zero Page,Y':
                target = (param + this.regs.Y) & 0xFF;
                source = this.LOAD(target);
                break;
            case 'Indirect,X':
                target = this.LOAD16ZP(param + this.regs.X);
                source = this.LOAD(target);
                break;
            case 'Indirect,Y':
                target = (this.LOAD16ZP(param) + this.regs.Y) & 0xFFFF;
                source = this.LOAD(target);
                break;
            case 'Absolute':
                target = param;
                source = this.LOAD(target);
                break;
            case 'Absolute,X':
                target = param + this.regs.X;
                source = this.LOAD(target);
                break;
            case 'Absolute,Y':
                target = param + this.regs.Y;
                source = this.LOAD(target);
                break;
            case 'Relative':
                source = this.REL_ADDR(this.regs.PC + 2, param);
                break;
            case 'Indirect':
                target = this.LOAD16(param);
                source = this.LOAD16(target);
                break;
            default:
                console.log('I dont know this address mode: ' + address_mode);
                break;

        }
        return [source, target, param];
    }
    setCarry(val) {
        this.flags.C = (val === 0) ? 1 : 0;
        if (this.flags.C) {
            this.regs.SR |= this.C;
        } else {
            this.regs.SR &= this.C ^ 0xFF;
        }
    }
    setZero(val) {
        this.flags.Z = (val === 0) ? 1 : 0;
        if (this.flags.Z) {
            this.regs.SR |= this.Z;
        } else {
            this.regs.SR &= this.Z ^ 0xFF;
        }
    }
    setInterrupt(val) {
        this.flags.I = (val === 0) ? 1 : 0;
        if (this.flags.I) {
            this.regs.SR |= this.I;
        } else {
            this.regs.SR &= this.I ^ 0xFF;
        }
    }

    setDecimal(val) {
        this.flags.I = (val === 0) ? 1 : 0;
        if (this.flags.I) {
            this.regs.SR |= this.I;
        } else {
            this.regs.SR &= this.I ^ 0xFF;
        }
    }
    setOverflow(val) {
        this.flags.V = (val === 0) ? 1 : 0;
        if (this.flags.V) {
            this.regs.SR |= this.V;
        } else {
            this.regs.SR &= this.V ^ 0xFF;
        }
    }
    setSign(val) {
        this.flags.N = ((val & 0x80) === 0) ? 0 : 1;
        if (this.flags.N) {
            this.regs.SR |= this.N;
        } else {
            this.regs.SR &= this.N ^ 0xFF;
        }
    }
    setBreak(val) {
        this.flags.B = (val === 0) ? 1 : 0;
        if (this.flags.B) {
            this.regs.SR |= this.B;
        } else {
            this.regs.SR &= this.B ^ 0xFF;
        }
    }
    setSR(val) {
        this.regs.SR = val;
        this.flags.C = val & this.C ? 1 : 0;
        this.flags.Z = val & this.Z ? 1 : 0;
        this.flags.I = val & this.I ? 1 : 0;
        this.flags.D = val & this.D ? 1 : 0;
        this.flags.B = val & this.B ? 1 : 0;
        this.flags.V = val & this.V ? 1 : 0;
        this.flags.N = val & this.N ? 1 : 0;
    }

    REL_ADDR(PC, offset) {
        if (offset > 0x7f) {
            offset = -(256 - offset);
        }
        PC += offset;
        if (PC < 0) {
            PC += 65536;
        }
        return PC;
    }
    doBranch(src) {
        this.clk += ((this.regs.PC & 0xFF00) !== (src & 0xFF00) ? 2 : 1);
        this.regs.PC = src;
    }
    PUSH(val) {
        const address = 0x100 + this.regs.SP;
        this.memory[address] = val;
        this.regs.SP = this.regs.SP - 1 & 0xff;
    }
    PULL() {
        this.regs.SP = this.regs.SP + 1 & 0xff;
        const address = 0x100 + this.regs.SP;
        return this.memory[address];
    }
    LOAD(address): number {
        let res: number;
        if (address >= this.org) {
            res = this.program_code[address - this.org];
        } else {
            res = this.memory[address];
            if (address === this.PPU_STATUS) {
                this.memory[this.PPU_STATUS] &= 0x7f;
            }
        }
        return res;
    }
    LOAD16(address): number {
        let res: number;
        if (address >= this.org) {
            res = this.program_code[address - this.org] +
                (this.program_code[address + 1 - this.org] * 256);
        } else {
            res = this.memory[address] + (this.memory[address + 1] * 256);
            if ((address === this.PPU_STATUS) || (address + 1  === this.PPU_STATUS)) {
                this.memory[this.PPU_STATUS] &= 0x7f;
            }
        }
        return res;
    }
    LOAD16ZP(address) {
        return this.memory[address] + (this.memory[(address + 1) & 0xFF] * 256);
    }

    STORE(val, address) {
        if (address === 'Accumulator') {
            this.regs.A = val;
        } else {
            if (address < this.org) {
                this.memory[address] = val;
            }
        }
    }
    ADC(src) {
        /* ADC */
        let temp = src + this.regs.A + (this.flags.C ? 1 : 0);
        this.setZero(temp & 0xff);	/* This is not valid in decimal mode */
        if (this.flags.D) {
            if (((this.regs.A & 0xf) + (src & 0xf) + (this.flags.C ? 1 : 0)) > 9) {
                temp += 6;
            }
            this.setSign(temp);
            this.setOverflow(!((this.regs.A ^ src) & 0x80) && ((this.regs.A ^ temp) & 0x80));
            if (temp > 0x99) {
                temp += 96;
            }
            this.setCarry(temp > 0x99);
        } else {
            this.setSign(temp);
            this.setOverflow(!((this.regs.A ^ src) & 0x80) && ((this.regs.A ^ temp) & 0x80));
            this.setCarry(temp > 0xff);
        }
        this.regs.A = ((temp + 0x100) & 0xff);
    }

    /* AND */
    AND(src) {
        src &= this.regs.A;
        this.setSign(src);
        this.setZero(src);
        this.regs.A = src;
    }
    /* ASL */
    ASL(src, address) {
        this.setCarry(src & 0x80);
        src <<= 1;
        src &= 0xff;
        this.setSign(src);
        this.setZero(src);
        this.STORE(address, src);
        // STORE src in memory or accumulator depending on addressing mode.
    }
    /* BCC */
    BCC(src) {
        if (!this.flags.C) {
            this.doBranch(src);
        }
    }
    /* BCS */
    BCS(src) {
        if (this.flags.C) {
            this.doBranch(src);
        }
    }

    /* BEQ */
    BEQ(src) {
        if (this.flags.Z) {
            this.doBranch(src);
        }
    }

    /* BIT */
    BIT(src) {
        this.setSign(src);
        this.setOverflow(0x40 & src);	/* Copy bit 6 to OVERFLOW flag. */
        this.setZero(src & this.regs.A);
    }
    /* BMI */
    BMI(src) {
        if (this.flags.N) {
            this.doBranch(src);
        }
    }

    /* BNE */
    BNE(src) {
        if (!this.flags.Z) {
            this.doBranch(src);
        }
    }
    BPL(src) {
        /* BPL */
        if (!this.flags.N) {
//            this.regs.PC = src;
            this.doBranch(src);
        }
    }

    /* BRK */
    BRK() {
        this.regs.PC++;
        this.PUSH((this.regs.PC >> 8) & 0xff);	/* Push return address onto the stack. */
        this.PUSH(this.regs.PC & 0xff);
        this.setBreak(1);             /* Set BFlag before pushing */
        this.PUSH(this.regs.SR);
        this.setInterrupt(1);
        this.regs.PC = (this.LOAD(0xFFFE) | (this.LOAD(0xFFFF) << 8));
    }
    /* BVC */
    BVC(src) {
        if (!this.flags.V) {
            this.doBranch(src);
        }
    }

    /* BVS */
    BVS(src) {
        if (this.flags.V) {
            this.doBranch(src);
        }
    }
    /* CLC */
    CLC() {
        this.setCarry(0);
    }

    /* CLD */
    CLD() {
        this.setDecimal(0);
    }
    /* CLI */
    CLI() {
        this.setInterrupt(0);
    }

    /* CLV */
    CLV() {
        this.setOverflow(0);
    }

    /* CMP */
    CMP(src) {
        src = this.regs.A - src;
        this.setCarry(src < 0x100);
        this.setSign(src);
        this.setZero(src &= 0xff);
    }
    /* CPX */
    CPX(src) {
        src = this.regs.X - src;
        this.setCarry(src < 0x100);
        this.setSign(src);
        this.setZero(src &= 0xff);
    }
    /* CPY */
    CPY(src) {
        src = this.regs.Y - src;
        this.setCarry(src < 0x100);
        this.setSign(src);
        this.setZero(src &= 0xff);
    }

    /* DEC */
    DEC(src, address) {
        src = (src - 1) & 0xff;
        this.setSign(src);
        this.setZero(src);
        this.STORE(address, src);
    }
    /* DEX */
    DEX() {
        let src = this.regs.X + 0x100;
        src = (src - 1) & 0xff;
        this.setSign(src);
        this.setZero(src);
        this.regs.X = src;
    }

    /* DEY */
    DEY() {
        let src = this.regs.Y + 0x100;
        src = (src - 1) & 0xff;
        this.setSign(src);
        this.setZero(src);
        this.regs.Y = src;
    }

    /* EOR */
    EOR(src) {
        src ^= this.regs.A;
        this.setSign(src);
        this.setZero(src);
        this.regs.A = src;
    }

    /* INC */
    INC(src, address) {
        src = (src + 1) & 0xff;
        this.setSign(src);
        this.setZero(src);
        this.STORE(address, src);
    }

    /* INX */
    INX() {
        let src = this.regs.X;
        src = (src + 1) & 0xff;
        this.setSign(src);
        this.setZero(src);
        this.regs.X = src;
    }

    /* INY */
    INY() {
        let src = this.regs.Y;
        src = (src + 1) & 0xff;
        this.setSign(src);
        this.setZero(src);
        this.regs.Y = src;
    }

    /* JMP */
    JMP(src, address) {
        this.regs.PC = address;
    }

    /* JSR */
    JSR(src, address) {
        this.regs.PC--;
        this.PUSH((this.regs.PC >> 8) & 0xff);	/* Push return address onto the stack. */
        this.PUSH(this.regs.PC & 0xff);
        this.regs.PC = address;
    }
    /* LDA */
    LDA(src) {
        this.setSign(src);
        this.setZero(src);
        this.regs.A = src;
    }
    /* LDX */
    LDX(src) {
        this.setSign(src);
        this.setZero(src);
        this.regs.X = src;
    }

    /* LDY */
    LDY(src) {
        this.setSign(src);
        this.setZero(src);
        this.regs.Y = src;
    }
    /* LSR */
    LSR(src, address) {
        this.setCarry(src & 0x01);
        src >>= 1;
        this.setSign(src);
        this.setZero(src);
        this.STORE(address, src);
        // STORE src in memory or accumulator depending on addressing mode.
    }
    /* NOP */
    NOP() {
        //    Nothing.
    }
    /* ORA */
    ORA(src) {
        src |= this.regs.A;
        this.setSign(src);
        this.setZero(src);
        this.regs.A = src;
    }

    /* PHA */

    PHA() {
        this.PUSH(this.regs.A);
    }
    /* PHP */

    PHP() {
        this.PUSH(this.regs.SR);
    }

    PLA() {
        /* PLA */
        this.regs.A = this.PULL();
        this.setSign(this.regs.A);	/* Change sign and zero flag accordingly. */
        this.setZero(this.regs.A);
    }

    /* PLP */
    PLP() {
        this.setSR(this.PULL());
    }
    /* ROL */
    ROL(src, address) {
        src <<= 1;
        if (this.flags.C) {
            src |= 0x1;
        }
        this.setCarry(src > 0xff);
        src &= 0xff;
        this.setSign(src);
        this.setZero(src);
        this.STORE(address, src);
        // STORE src in memory or accumulator depending on addressing mode.
}
    /* ROR */
    ROR(src, address) {
        if (this.flags.C) {
            src |= 0x100;
        }
        this.setCarry(src & 0x01);
        src >>= 1;
        this.setSign(src);
        this.setZero(src);
        this.STORE(address, src);
        // STORE src in memory or accumulator depending on addressing mode.
    }
    /* RTI */
    RTI() {
        this.setSR(this.PULL());
        let src = this.PULL();
        src |= (this.PULL() << 8);	/* Load return address from stack. */
        this.regs.PC = src;
    }

    /* RTS */
    RTS() {
        let src = this.PULL();
        src += ((this.PULL()) << 8) + 1;	/* Load return address from stack and add 1. */
        this.regs.PC = src;
    }

    /* SBC */
    SBC(src) {
        let temp = this.regs.A - src - (this.flags.C ? 0 : 1);
        this.setSign(temp);
        this.setZero(temp & 0xff);	/* Sign and Zero are invalid in decimal mode */
        this.setOverflow(((this.regs.A ^ temp) & 0x80) && ((this.regs.A ^ src) & 0x80));
        if (this.flags.D) {
            if (((this.regs.A & 0xf) - (this.flags.C ? 0 : 1)) < (src & 0xf)) /* EP */ {
                temp -= 6;
            }
            if (temp > 0x99) {
                temp -= 0x60;
            }
        }
        this.setCarry(temp < 0x100);
        this.regs.A = (temp & 0xff);
    }

    /* SEC */
    SEC() {
        this.setCarry(1);
    }
    /* SED */
    SED() {
        this.setDecimal(1);
    }
    /* SEI */
    SEI() {
        this.setInterrupt(1);
    }

    /* STA */
    STA(src, address) {
        this.STORE(address, this.regs.A);
    }

    /* STX */
    STX(src, address) {
        this.STORE(address, this.regs.X);
    }
    /* STY */
    STY(src, address) {
        this.STORE(address, this.regs.Y);
    }
    /* TAX */
    TAX() {
        this.setSign(this.regs.A);
        this.setZero(this.regs.A);
        this.regs.X = this.regs.A;
    }

    /* TAY */
    TAY() {
        this.setSign(this.regs.A);
        this.setZero(this.regs.A);
        this.regs.Y = this.regs.A;
    }
    /* TSX */
    TSX() {
        this.setSign(this.regs.SP);
        this.setZero(this.regs.SP);
        this.regs.X = this.regs.SP;
    }
    /* TXA */
    TXA() {
        this.setSign(this.regs.X);
        this.setZero(this.regs.X);
        this.regs.A = this.regs.X;
    }

    /* TXS */
    TXS() {
        this.regs.SP = this.regs.X;
    }

    /* TYA */
    TYA() {
        this.regs.A = this.regs.Y;
        this.setSign(this.regs.A);
        this.setZero(this.regs.A);
    }
}
