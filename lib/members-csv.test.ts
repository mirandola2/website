import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBirthday, parseMembersCsv } from './members-csv'

test('parseBirthday reads Italian and ISO dates, rejects impossible ones', () => {
  assert.equal(parseBirthday('31/12/2012'), '2012-12-31')
  assert.equal(parseBirthday('1/2/2010'), '2010-02-01')
  assert.equal(parseBirthday('2012-12-31'), '2012-12-31')
  assert.equal(parseBirthday('31/02/2012'), null)
  assert.equal(parseBirthday('12/31/2012'), null)
  assert.equal(parseBirthday('2012/12/31'), null)
  assert.equal(parseBirthday(''), null)
})

test('parseMembersCsv accepts comma or semicolon, BOM and extra spaces', () => {
  const comma = parseMembersCsv('codice_socio,nome_cognome,data_nascita\n123456, mario   rossi ,31/12/2012\n')
  const semicolon = parseMembersCsv('﻿Codice_Socio;Nome_Cognome;Data_Nascita\r\n123456;MARIO ROSSI;2012-12-31\r\n\r\n')
  assert.deepEqual(comma, { ok: true, rows: [{ memberCode: '123456', fullName: 'mario rossi', birthday: '2012-12-31' }] })
  assert.deepEqual(semicolon, { ok: true, rows: [{ memberCode: '123456', fullName: 'MARIO ROSSI', birthday: '2012-12-31' }] })
})

test('parseMembersCsv reports the header and bad rows with their line', () => {
  assert.deepEqual(parseMembersCsv('codice,nome\n1,A'), {
    ok: false,
    errors: ['Intestazione mancante: codice_socio, nome_cognome, data_nascita. La prima riga deve essere codice_socio,nome_cognome,data_nascita'],
  })
  const bad = parseMembersCsv('codice_socio,nome_cognome,data_nascita\nabc,A,01/01/2010\n2,,01/01/2010\n3,C,32/01/2010\n4,D,01/01/2010\n4,E,01/01/2010')
  assert.deepEqual(bad, {
    ok: false,
    errors: [
      'Riga 2: codice socio non valido.',
      'Riga 3: nome mancante o troppo lungo.',
      'Riga 4: data di nascita non valida (GG/MM/AAAA).',
      'Riga 6: codice socio 4 ripetuto.',
    ],
  })
})
