import { Component, OnInit } from '@angular/core';
import { Http, ResponseContentType } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs/Subject';
import { Assembler } from './assembler';
import { Emulator } from './emulator';
// import { RomLoader } from './rom_loader';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  rom: ArrayBuffer;
  rom_view: Uint8ClampedArray;

  a: Assembler = new Assembler();
  // rom_loader: RomLoader;
  constructor(private httpClient: HttpClient, private http: Http) { }

  load(file: string): Subject<boolean> {
    const subj: Subject<boolean> = new Subject<boolean>();
    this.http.get(file, { responseType: ResponseContentType.ArrayBuffer }).subscribe(res => {
      this.rom = res['_body'];
      this.rom_view = new Uint8ClampedArray(this.rom);
      subj.next(true);
    }, error => { subj.next(false) });
    return subj;
  }
  ngOnInit() {

    //    this.rom_loader = new RomLoader(this.http);
    this.load('/assets/SuperMarioBrosE.nes').subscribe(res => {
      if (res) {
        const str = String.fromCharCode(this.rom_view[0], this.rom_view[1], this.rom_view[2]);

        this.httpClient.get('/assets/mario.txt', { responseType: 'text' }).subscribe(res2 => {
          const lines = res2.split('\n');

          const memory = this.a.assemble(lines);
          const labels = this.a.labels;
          const assembled_code = new Uint8ClampedArray(memory);
          const rv = this.rom_view;
          const chr_rom = this.rom_view.slice(32768 + 16, 32768 + 16 + 8192);
          const program_code = this.rom_view.slice(16, 32768 + 16);
          const op_codes = this.a.invertOps();

          const emulator = new Emulator(assembled_code, chr_rom, op_codes,
              this.a.org, labels);
          emulator.reset();
          emulator.regs.PC = 0x8000;
          for ( let i = 0; i < 500; i++) {
            emulator.step();
            emulator.stepHardWare();
          }

 /*         let i = 3601;
          while (i < 3611) {
            const byte = memory[i];
            const byte2 = program_code[i];
            if (byte2 !== byte) {
              console.log('mismatch at ' + i + ' ' + parseInt(byte, 16));
              console.log(parseInt(byte, 16) + '!= ' + parseInt(byte.toString(), 16));
              i++;
            } else if (op_codes.hasOwnProperty(byte)) {
              const instr = op_codes[byte];
              console.log(instr[0] + ' ' + instr[1]);
              if (instr[2] > 0) {
                i += instr[2];
              } else {
                i++;
              }
            } else {
              i++;
            } */
          });



      }
    });


  }
}
