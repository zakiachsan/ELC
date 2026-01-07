-- =====================================================
-- Migration: Import Students SD & SMP ABDI SISWA ARIES
-- Date: 2025-01-06
-- Description: Creates auth users and profiles for 415 students
--              from SD ABDI SISWA ARIES (308) and SMP ABDI SISWA ARIES (107)
-- =====================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Create temporary function to add students
-- =====================================================
CREATE OR REPLACE FUNCTION temp_add_student(
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_jenjang TEXT,
  p_kelas TEXT,
  p_tipe_kelas TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_location_id UUID;
  v_school_name TEXT;
BEGIN
  -- Generate user ID
  v_user_id := uuid_generate_v4();

  -- Determine school name based on jenjang
  IF p_jenjang = 'SD' THEN
    v_school_name := 'SD ABDI SISWA ARIES';
  ELSE
    v_school_name := 'SMP ABDI SISWA ARIES';
  END IF;

  -- Get location ID
  SELECT id INTO v_location_id FROM locations WHERE name = v_school_name;

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', p_name, 'kelas', p_kelas, 'tipe_kelas', p_tipe_kelas)
  );

  -- Insert into profiles
  INSERT INTO profiles (
    id,
    name,
    email,
    role,
    status,
    assigned_location_id,
    school_origin,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_name,
    p_email,
    'STUDENT',
    'ACTIVE',
    v_location_id,
    v_school_name || ' - ' || p_kelas || ' (' || p_tipe_kelas || ')',
    NOW(),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SD KELAS 1 BILINGUAL (7 students)
-- =====================================================
SELECT temp_add_student('Edward Mario Chandyka', 'edward.chandyka@enormous1.com', 'edward123', 'SD', '1 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Emma Gracella Amali', 'emma.amali@enormous1.com', 'emma123', 'SD', '1 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Given Arron Leksono', 'given.leksono@enormous1.com', 'given123', 'SD', '1 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Jillian Ang', 'jillian.ang@enormous1.com', 'jillian123', 'SD', '1 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Miguel Fernando Estefan', 'miguel.estefan@enormous1.com', 'miguel123', 'SD', '1 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Natalie Jelita Padgett', 'natalie.padgett@enormous1.com', 'natalie123', 'SD', '1 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Rafael Joyce Nurtjahyo', 'rafael.nurtjahyo@enormous1.com', 'rafael123', 'SD', '1 BILINGUAL', 'Bilingual');

-- =====================================================
-- SD KELAS 2 BILINGUAL (6 students)
-- =====================================================
SELECT temp_add_student('Armel Lourdes Koe', 'armel.koe@enormous1.com', 'armel123', 'SD', '2 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Cristine Setia Budi', 'cristine.budi@enormous1.com', 'cristine123', 'SD', '2 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Jonathan Jacob Ferdinandz', 'jonathan.ferdinandz@enormous1.com', 'jonathan123', 'SD', '2 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Jose Oktario Wijayadiyahya', 'jose.wijayadiyahya@enormous1.com', 'jose123', 'SD', '2 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Logen Clinton Go', 'logen.go@enormous1.com', 'logen123', 'SD', '2 BILINGUAL', 'Bilingual');
SELECT temp_add_student('Rafael Ricstano', 'rafael.ricstano@enormous1.com', 'rafael123', 'SD', '2 BILINGUAL', 'Bilingual');

-- =====================================================
-- SD KELAS 1A (23 students)
-- =====================================================
SELECT temp_add_student('Alanzo Keenandra Manuputty', 'alanzo.manuputty@enormous1.com', 'alanzo123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Alritz Kenzie', 'alritz.kenzie@enormous1.com', 'alritz123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Angelica Putri Radisty', 'angelica.radisty@enormous1.com', 'angelica123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Aurelius Cello Raditya Yudianto', 'aurelius.yudianto@enormous1.com', 'aurelius123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Chalinda Amora Susilo', 'chalinda.susilo@enormous1.com', 'chalinda123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Clarissa Cecilia Pardosi', 'clarissa.pardosi@enormous1.com', 'clarissa123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Cornelius Kevin Tjahjadi', 'cornelius.tjahjadi@enormous1.com', 'cornelius123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Deandra Elnathan Sebayang', 'deandra.sebayang@enormous1.com', 'deandra123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Elnathan Adrinoel Siahaan', 'elnathan.siahaan@enormous1.com', 'elnathan123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Evelyn Britania Oriza', 'evelyn.oriza@enormous1.com', 'evelyn123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Gema Aprilia Selong', 'gema.selong@enormous1.com', 'gema123', 'SD', '1A', 'Regular');
SELECT temp_add_student('James Isaiah Junaedi', 'james.junaedi@enormous1.com', 'james123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Javier Oliver Hermanto', 'javier.hermanto@enormous1.com', 'javier123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Jordan Sanjaya', 'jordan.sanjaya@enormous1.com', 'jordan123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Keisho Adonis', 'keisho.adonis@enormous1.com', 'keisho123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Keyra Alanna Grizel Lionheart', 'keyra.lionheart@enormous1.com', 'keyra123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Kyle Dominique Kenap', 'kyle.kenap@enormous1.com', 'kyle123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Louis Emilius Edward', 'louis.edward@enormous1.com', 'louis123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Michelle Joelin Saragih', 'michelle.saragih@enormous1.com', 'michelle123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Ricardo Benedict Syah', 'ricardo.syah@enormous1.com', 'ricardo123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Samantha Gabrielle Yosetta', 'samantha.yosetta@enormous1.com', 'samantha123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Vania Grizelle Nata', 'vania.nata@enormous1.com', 'vania123', 'SD', '1A', 'Regular');
SELECT temp_add_student('Vitruvius Batistuta Boli Hurek', 'vitruvius.hurek@enormous1.com', 'vitruvius123', 'SD', '1A', 'Regular');

-- =====================================================
-- SD KELAS 1B (24 students)
-- =====================================================
SELECT temp_add_student('Aaron Hutanoto', 'aaron.hutanoto@enormous1.com', 'aaron123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Benedict Arthur Natawiria', 'benedict.natawiria@enormous1.com', 'benedict123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Cheryl Bianca Sitompul', 'cheryl.sitompul@enormous1.com', 'cheryl123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Christanty Riana Hutabarat', 'christanty.hutabarat@enormous1.com', 'christanty123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Edric Reagan Setiono', 'edric.setiono@enormous1.com', 'edric123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Edward Jacob Harliman', 'edward.harliman@enormous1.com', 'edward123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Ezio Farros Langelo', 'ezio.langelo@enormous1.com', 'ezio123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Gabriella Lynskey Febrianta', 'gabriella.febrianta@enormous1.com', 'gabriella123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Gilberth Giovany Lake', 'gilberth.lake@enormous1.com', 'gilberth123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Given Rado Franz', 'given.franz@enormous1.com', 'given123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Gladisya Yovanka Prasetyo', 'gladisya.prasetyo@enormous1.com', 'gladisya123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Gregorius Samuel Sihombing', 'gregorius.sihombing@enormous1.com', 'gregorius123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Javier Tanniko', 'javier.tanniko@enormous1.com', 'javier123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Jonathan Adley Hezekia', 'jonathan.hezekia@enormous1.com', 'jonathan123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Leonardus Yoseph Kurniawan', 'leonardus.kurniawan@enormous1.com', 'leonardus123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Lukas Auron Tamboto', 'lukas.tamboto@enormous1.com', 'lukas123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Nicholas Filbert Timothy Tobing', 'nicholas.tobing@enormous1.com', 'nicholas123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Renata Valerie Dharmawidjaja', 'renata.dharmawidjaja@enormous1.com', 'renata123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Sada Mutiara Calista', 'sada.calista@enormous1.com', 'sada123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Sean Denison Manuel', 'sean.manuel@enormous1.com', 'sean123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Selena Olivia Manuelin', 'selena.manuelin@enormous1.com', 'selena123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Seline Olivia Manuelin', 'seline.manuelin@enormous1.com', 'seline123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Serafina Ferrara Sava', 'serafina.sava@enormous1.com', 'serafina123', 'SD', '1B', 'Regular');
SELECT temp_add_student('Yoona Marcia Wijaya', 'yoona.wijaya@enormous1.com', 'yoona123', 'SD', '1B', 'Regular');

-- =====================================================
-- SD KELAS 2A (20 students)
-- =====================================================
SELECT temp_add_student('Abigail Celine Eleanor', 'abigail.eleanor@enormous1.com', 'abigail123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Arietta Eliora Pintauli Purba', 'arietta.purba@enormous1.com', 'arietta123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Azka Gomgom Sidabutar', 'azka.sidabutar@enormous1.com', 'azka123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Benedictus Kenzo Ato', 'benedictus.ato@enormous1.com', 'benedictus123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Dominique Keiko Kurniawan', 'dominique.kurniawan@enormous1.com', 'dominique123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Gabriella Kimberly Paska', 'gabriella.paska@enormous1.com', 'gabriella123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Helena Valerie Irawan', 'helena.irawan@enormous1.com', 'helena123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Ignacio Mario Aaron Parama', 'ignacio.parama@enormous1.com', 'ignacio123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Immanuela Monica Jasslyn Budiono', 'immanuela.budiono@enormous1.com', 'immanuela123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Jason Matthew', 'jason.matthew@enormous1.com', 'jason123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Jean Nicholas Yefta Saragih', 'jean.saragih@enormous1.com', 'jean123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Joshua Surya Sudradjat', 'joshua.sudradjat@enormous1.com', 'joshua123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Katarina Prisha Ertanto', 'katarina.ertanto@enormous1.com', 'katarina123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Kristoff Putra Ngadimin', 'kristoff.ngadimin@enormous1.com', 'kristoff123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Marcelina Nathalia Putri', 'marcelina.putri@enormous1.com', 'marcelina123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Marco Sebastian Hermoko', 'marco.hermoko@enormous1.com', 'marco123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Raphaella Freya Houston Widjaja', 'raphaella.widjaja@enormous1.com', 'raphaella123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Sophie Evangeline Moeljadi', 'sophie.moeljadi@enormous1.com', 'sophie123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Stephanie Elisabeth Antonia', 'stephanie.antonia@enormous1.com', 'stephanie123', 'SD', '2A', 'Regular');
SELECT temp_add_student('Theresia Natalie Vania Kosasih', 'theresia.kosasih@enormous1.com', 'theresia123', 'SD', '2A', 'Regular');

-- =====================================================
-- SD KELAS 2B (21 students)
-- =====================================================
SELECT temp_add_student('Aaron Benedict Go', 'aaron.go@enormous1.com', 'aaron123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Bernadette Putri Purnama Sari', 'bernadette.sari@enormous1.com', 'bernadette123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Carissa Adara Widiatmo', 'carissa.widiatmo@enormous1.com', 'carissa123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Celenia Nichole Jawak', 'celenia.jawak@enormous1.com', 'celenia123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Celine Jean Wijaya', 'celine.wijaya@enormous1.com', 'celine123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Christabel Bunga Martha Manurung', 'christabel.manurung@enormous1.com', 'christabel123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Christiano Bungaran Marthin Manurung', 'christiano.manurung@enormous1.com', 'christiano123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Denzel Maruli Nainggolan', 'denzel.nainggolan@enormous1.com', 'denzel123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Febrina Jocelyn Callysta', 'febrina.callysta@enormous1.com', 'febrina123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Flavianus Diandra Ardhani Suyadi', 'flavianus.suyadi@enormous1.com', 'flavianus123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Fransesco Jasper Lie', 'fransesco.lie@enormous1.com', 'fransesco123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Gavriel Ethan Kho', 'gavriel.kho@enormous1.com', 'gavriel123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Harvey Santosa', 'harvey.santosa@enormous1.com', 'harvey123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Heronimus Regan Gustavo Horo', 'heronimus.horo@enormous1.com', 'heronimus123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Kacey Serafin Auristela', 'kacey.auristela@enormous1.com', 'kacey123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Karel Gamaliel Wibowo', 'karel.wibowo@enormous1.com', 'karel123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Keirra Elaine Hardja', 'keirra.hardja@enormous1.com', 'keirra123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Kendrick Jose Sandrian', 'kendrick.sandrian@enormous1.com', 'kendrick123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Marlyen Gabriella Gunojo', 'marlyen.gunojo@enormous1.com', 'marlyen123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Sebastian Joel Simanungkalit', 'sebastian.simanungkalit@enormous1.com', 'sebastian123', 'SD', '2B', 'Regular');
SELECT temp_add_student('Shalom Malona Sibarani', 'shalom.sibarani@enormous1.com', 'shalom123', 'SD', '2B', 'Regular');

-- =====================================================
-- SD KELAS 3A (19 students)
-- =====================================================
SELECT temp_add_student('Alexander Cantona', 'alexander.cantona@enormous1.com', 'alexander123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Bernadete Renata Cahyani', 'bernadete.cahyani@enormous1.com', 'bernadete123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Chrisna Arnanda Hutabarat', 'chrisna.hutabarat@enormous1.com', 'chrisna123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Dave Eldrick', 'dave.eldrick@enormous1.com', 'dave123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Giselle Hans Nathania', 'giselle.nathania@enormous1.com', 'giselle123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Hizkia Ravarro Sebayang', 'hizkia.sebayang@enormous1.com', 'hizkia123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Joseph Bright Manurung', 'joseph.manurung@enormous1.com', 'joseph123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Juan Gava Halomoan Lumban Tobing', 'juan.tobing@enormous1.com', 'juan123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Katherine Mulyawan', 'katherine.mulyawan@enormous1.com', 'katherine123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Leonard Matthew Mamahit', 'leonard.mamahit@enormous1.com', 'leonard123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Leticia Michelle', 'leticia.michelle@enormous1.com', 'leticia123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Michael Nathanael Harumina Kartika', 'michael.kartika@enormous1.com', 'michael123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Nathania Graciella Siregar', 'nathania.siregar@enormous1.com', 'nathania123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Nicholas Jessie Aprilio', 'nicholas.aprilio@enormous1.com', 'nicholas123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Olivia Phanditya', 'olivia.phanditya@enormous1.com', 'olivia123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Queenara Reghina Maria Dalope', 'queenara.dalope@enormous1.com', 'queenara123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Richelle Victoria Halim', 'richelle.halim@enormous1.com', 'richelle123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Ruth Natalie Tangketasik', 'ruth.tangketasik@enormous1.com', 'ruth123', 'SD', '3A', 'Regular');
SELECT temp_add_student('Yoel Julius Yang', 'yoel.yang@enormous1.com', 'yoel123', 'SD', '3A', 'Regular');

-- =====================================================
-- SD KELAS 3B (19 students)
-- =====================================================
SELECT temp_add_student('Aaron Tyrell Mulyawan', 'aaron.mulyawan@enormous1.com', 'aaron123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Adriel Ethaniel Santoso', 'adriel.santoso@enormous1.com', 'adriel123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Aerilyn Bellvania Basrin', 'aerilyn.basrin@enormous1.com', 'aerilyn123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Alden Umani Padmana', 'alden.padmana@enormous1.com', 'alden123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Beatrice Bernessa', 'beatrice.bernessa@enormous1.com', 'beatrice123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Catharina Aletta Prasetyo', 'catharina.prasetyo@enormous1.com', 'catharina123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Catherine Lorianne Ricci', 'catherine.ricci@enormous1.com', 'catherine123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Christny Bellvania Argadongan', 'christny.argadongan@enormous1.com', 'christny123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Edgar Keane Setiono', 'edgar.setiono@enormous1.com', 'edgar123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Ezechiel Fileon Gunawan', 'ezechiel.gunawan@enormous1.com', 'ezechiel123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Howard Ramosta Probert Sitinjak', 'howard.sitinjak@enormous1.com', 'howard123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Jacquelin Kirsten', 'jacquelin.kirsten@enormous1.com', 'jacquelin123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Jason Hendylim', 'jason.hendylim@enormous1.com', 'jason123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Juan Agusto Tungkir Silalahi', 'juan.silalahi@enormous1.com', 'juan123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Kimberly Gabrielle Wirahadi', 'kimberly.wirahadi@enormous1.com', 'kimberly123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Nevan Benedict Adriell Tobing', 'nevan.tobing@enormous1.com', 'nevan123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Rafaella Jovanka Koesmali', 'rafaella.koesmali@enormous1.com', 'rafaella123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Ryounha Magda Lena Iskandar', 'ryounha.iskandar@enormous1.com', 'ryounha123', 'SD', '3B', 'Regular');
SELECT temp_add_student('Xander Julius Yang', 'xander.yang@enormous1.com', 'xander123', 'SD', '3B', 'Regular');

-- =====================================================
-- SD KELAS 4A (24 students)
-- =====================================================
SELECT temp_add_student('Alesanov Galendra Siahaan', 'alesanov.siahaan@enormous1.com', 'alesanov123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Caitlyn Caelis Angelica', 'caitlyn.angelica@enormous1.com', 'caitlyn123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Clara Evelina Pramudita', 'clara.pramudita@enormous1.com', 'clara123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Evan Antonius', 'evan.antonius@enormous1.com', 'evan123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Gwyneth Patricia Hermanto', 'gwyneth.hermanto@enormous1.com', 'gwyneth123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Henok Martus Kristo Manik', 'henok.manik@enormous1.com', 'henok123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Hortencia Heint', 'hortencia.heint@enormous1.com', 'hortencia123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Jennifer Alice Gumulya', 'jennifer.gumulya@enormous1.com', 'jennifer123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Jocelyn Wijayadiyahya', 'jocelyn.wijayadiyahya@enormous1.com', 'jocelyn123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Jonathan Xavier Syah', 'jonathan.syah@enormous1.com', 'jonathan123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Jovan Frederen Komala', 'jovan.komala@enormous1.com', 'jovan123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Katharina Jesselyn Budiyanto', 'katharina.budiyanto@enormous1.com', 'katharina123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Kezia Angelica', 'kezia.angelica@enormous1.com', 'kezia123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Lionel Nata Halim', 'lionel.halim@enormous1.com', 'lionel123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Lucretia Emily Hardja', 'lucretia.hardja@enormous1.com', 'lucretia123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Maximilian Axel Rousnalddy', 'maximilian.rousnalddy@enormous1.com', 'maximilian123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Mikael Amadeus Cirillo Prasetya', 'mikael.prasetya@enormous1.com', 'mikael123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Owen Gerald Marly', 'owen.marly@enormous1.com', 'owen123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Ramona Intania Toratu Masarrang', 'ramona.masarrang@enormous1.com', 'ramona123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Sebastian Giovann Djimantoro', 'sebastian.djimantoro@enormous1.com', 'sebastian123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Sophia Clara Maia Hartono', 'sophia.hartono@enormous1.com', 'sophia123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Viliana Lavanya', 'viliana.lavanya@enormous1.com', 'viliana123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Yudhistira Tjhin', 'yudhistira.tjhin@enormous1.com', 'yudhistira123', 'SD', '4A', 'Regular');
SELECT temp_add_student('Zeline Clairine Winarto', 'zeline.winarto@enormous1.com', 'zeline123', 'SD', '4A', 'Regular');

-- =====================================================
-- SD KELAS 4B (23 students)
-- =====================================================
SELECT temp_add_student('Alvaro Gabriel Yean', 'alvaro.yean@enormous1.com', 'alvaro123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Andrew Christian Putra', 'andrew.putra@enormous1.com', 'andrew123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Angelina Clara Tanamal', 'angelina.tanamal@enormous1.com', 'angelina123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Camilla Giovanna Natalie', 'camilla.natalie@enormous1.com', 'camilla123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Chiara Angelica', 'chiara.angelica@enormous1.com', 'chiara123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Chloe Jeslyn Sintadi', 'chloe.sintadi@enormous1.com', 'chloe123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Claire Meikhaela Yvet', 'claire.yvet@enormous1.com', 'claire123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Cleveland Lysen', 'cleveland.lysen@enormous1.com', 'cleveland123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Debora Sekar Nugraheni', 'debora.nugraheni@enormous1.com', 'debora123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Eleanor Filia Gunawan', 'eleanor.gunawan@enormous1.com', 'eleanor123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Franciscus Xaverius Prasth Prasetya', 'franciscus.prasetya@enormous1.com', 'franciscus123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Gabriel Keiichi Nafiri', 'gabriel.nafiri@enormous1.com', 'gabriel123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Gabriel Matteo Sunarto', 'gabriel.sunarto@enormous1.com', 'gabriel123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Gavriel Archelaus Alvaro Simanjuntak', 'gavriel.simanjuntak@enormous1.com', 'gavriel123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Hazell Jacqueline Orlaithe Iliadi', 'hazell.iliadi@enormous1.com', 'hazell123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Jaden Sanjaya', 'jaden.sanjaya@enormous1.com', 'jaden123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Jocelyn Ashley Moonella', 'jocelyn.moonella@enormous1.com', 'jocelyn123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Justin Maxwell Tjandra', 'justin.tjandra@enormous1.com', 'justin123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Kaytlin Kurniawan Tang', 'kaytlin.tang@enormous1.com', 'kaytlin123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Leonardus Reinhart Leander', 'leonardus.leander@enormous1.com', 'leonardus123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Matthew Arya Moeljadi', 'matthew.moeljadi@enormous1.com', 'matthew123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Morice Junieta Putri Jaya', 'morice.jaya@enormous1.com', 'morice123', 'SD', '4B', 'Regular');
SELECT temp_add_student('Raja Jose Immanuel Putra Matondang', 'raja.matondang@enormous1.com', 'raja123', 'SD', '4B', 'Regular');

-- =====================================================
-- SD KELAS 5A (22 students)
-- =====================================================
SELECT temp_add_student('Aerilyn Jovanna Rusli', 'aerilyn.rusli@enormous1.com', 'aerilyn123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Aldric Fidellis Simatupang', 'aldric.simatupang@enormous1.com', 'aldric123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Aletalya Rose Jawak', 'aletalya.jawak@enormous1.com', 'aletalya123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Allegro Sastrajendra Sambhava Djogdja', 'allegro.djogdja@enormous1.com', 'allegro123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Anastasya Juveivi Ekaristi Tentero', 'anastasya.tentero@enormous1.com', 'anastasya123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Brandon Delano Maelie', 'brandon.maelie@enormous1.com', 'brandon123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Cheng Tai', 'cheng.tai@enormous1.com', 'cheng123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Chiando Kaleb Roganda Simbolon', 'chiando.simbolon@enormous1.com', 'chiando123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Dareen Khalfani Simatupang', 'dareen.simatupang@enormous1.com', 'dareen123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Dominic Kenzo Kurniawan', 'dominic.kurniawan@enormous1.com', 'dominic123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Frederick Nathanael Arianto', 'frederick.arianto@enormous1.com', 'frederick123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Gabriel Arkhasa Prasraya Soerjodipoero', 'gabriel.soerjodipoero@enormous1.com', 'gabriel123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Immanuel Alfonso Jason Budiono', 'immanuel.budiono@enormous1.com', 'immanuel123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Ivanna Florencia Octovin Siregar', 'ivanna.siregar@enormous1.com', 'ivanna123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Jeremy Hasiholan Tua Lumban Tobing', 'jeremy.tobing@enormous1.com', 'jeremy123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Jonathan Volta Tanamas', 'jonathan.tanamas@enormous1.com', 'jonathan123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Jordan Ang', 'jordan.ang@enormous1.com', 'jordan123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Kendrix Evander Joachim', 'kendrix.joachim@enormous1.com', 'kendrix123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Laurentia Widya Gani', 'laurentia.gani@enormous1.com', 'laurentia123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Maria Novelia Sari', 'maria.sari@enormous1.com', 'maria123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Sachi Xaviera Siauw', 'sachi.siauw@enormous1.com', 'sachi123', 'SD', '5A', 'Regular');
SELECT temp_add_student('Theodore Patar Nainggolan', 'theodore.nainggolan@enormous1.com', 'theodore123', 'SD', '5A', 'Regular');

-- =====================================================
-- SD KELAS 5B (21 students)
-- =====================================================
SELECT temp_add_student('Adyuta Kayana Pramudian', 'adyuta.pramudian@enormous1.com', 'adyuta123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Angelina Mercy Hutapea', 'angelina.hutapea@enormous1.com', 'angelina123', 'SD', '5B', 'Regular');
SELECT temp_add_student('David Gerent Taka Tiwa', 'david.tiwa@enormous1.com', 'david123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Dilshania Raj Kaur', 'dilshania.kaur@enormous1.com', 'dilshania123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Edmund Hugo', 'edmund.hugo@enormous1.com', 'edmund123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Eliora Celine Katarina', 'eliora.katarina@enormous1.com', 'eliora123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Elizabeth Kesya Nathania Harumina Kartika', 'elizabeth.kartika@enormous1.com', 'elizabeth123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Emanuella Keenar Alverta Swadono', 'emanuella.swadono@enormous1.com', 'emanuella123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Gifty Asean Sihotang', 'gifty.sihotang@enormous1.com', 'gifty123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Jaden Kurniawan Tang', 'jaden.tang@enormous1.com', 'jaden123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Jesslyn Brianna Rieo', 'jesslyn.rieo@enormous1.com', 'jesslyn123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Joanna Adriella Wattimury', 'joanna.wattimury@enormous1.com', 'joanna123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Jonathan Ray Aritonang', 'jonathan.aritonang@enormous1.com', 'jonathan123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Kennard Nathaneil', 'kennard.nathaneil@enormous1.com', 'kennard123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Kenzie Mulyawan', 'kenzie.mulyawan@enormous1.com', 'kenzie123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Mary Margareth Edna Nie', 'mary.nie@enormous1.com', 'mary123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Nathanael Tristan Parlindungan', 'nathanael.parlindungan@enormous1.com', 'nathanael123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Nicholas Christopher Andreas', 'nicholas.andreas@enormous1.com', 'nicholas123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Nicholas Phanditya', 'nicholas.phanditya@enormous1.com', 'nicholas123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Reygen Manhattan Go', 'reygen.go@enormous1.com', 'reygen123', 'SD', '5B', 'Regular');
SELECT temp_add_student('Ryounjo Micah Leno Iskandar', 'ryounjo.iskandar@enormous1.com', 'ryounjo123', 'SD', '5B', 'Regular');

-- =====================================================
-- SD KELAS 6A (26 students)
-- =====================================================
SELECT temp_add_student('Agatha Hellena Limbong', 'agatha.limbong@enormous1.com', 'agatha123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Alvaro Leonhart Manuputty', 'alvaro.manuputty@enormous1.com', 'alvaro123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Andrea Edgina Karoma', 'andrea.karoma@enormous1.com', 'andrea123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Antonia Carmelitha', 'antonia.carmelitha@enormous1.com', 'antonia123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Beatrice Calista Audrey Wijaya', 'beatrice.wijaya@enormous1.com', 'beatrice123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Ethanael Andrew Harliman', 'ethanael.harliman@enormous1.com', 'ethanael123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Eva Jovanna Maria Salim', 'eva.salim@enormous1.com', 'eva123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Exelcius Derikho Edhie', 'exelcius.edhie@enormous1.com', 'exelcius123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Faye Heavenly', 'faye.heavenly@enormous1.com', 'faye123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Giovanna Nadine Gumulya', 'giovanna.gumulya@enormous1.com', 'giovanna123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Intan Felicia Nainggolan', 'intan.nainggolan@enormous1.com', 'intan123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Ivanna Chosovi', 'ivanna.chosovi@enormous1.com', 'ivanna123', 'SD', '6A', 'Regular');
SELECT temp_add_student('James Alexander', 'james.alexander@enormous1.com', 'james123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Jason Ferdinand Alexander', 'jason.alexander@enormous1.com', 'jason123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Jennifer Elisabeth Runtu', 'jennifer.runtu@enormous1.com', 'jennifer123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Kendrick Alexander', 'kendrick.alexander@enormous1.com', 'kendrick123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Kenzo Rayden Cahyo', 'kenzo.cahyo@enormous1.com', 'kenzo123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Kimberly Putri Ngadimin', 'kimberly.ngadimin@enormous1.com', 'kimberly123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Maximus Marquez Moy', 'maximus.moy@enormous1.com', 'maximus123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Natasha Angeline Tarigan', 'natasha.tarigan@enormous1.com', 'natasha123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Nathanael Raymond', 'nathanael.raymond@enormous1.com', 'nathanael123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Nathania Leonora Louhenapessy', 'nathania.louhenapessy@enormous1.com', 'nathania123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Nicholas Davino Liu', 'nicholas.liu@enormous1.com', 'nicholas123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Samuel Christian Jayadinata', 'samuel.jayadinata@enormous1.com', 'samuel123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Sophia Liora Clarita Saragih', 'sophia.saragih@enormous1.com', 'sophia123', 'SD', '6A', 'Regular');
SELECT temp_add_student('Yohanes Abimanyu Arsa Bhuana', 'yohanes.bhuana@enormous1.com', 'yohanes123', 'SD', '6A', 'Regular');

-- =====================================================
-- SD KELAS 6B (26 students)
-- =====================================================
SELECT temp_add_student('Amanda Lovietha Pratanto', 'amanda.pratanto@enormous1.com', 'amanda123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Anastasia Anindya Purnadi', 'anastasia.purnadi@enormous1.com', 'anastasia123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Angela Mikaela Kosasih', 'angela.kosasih@enormous1.com', 'angela123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Banneraya Yura Putri Janto Mangiri', 'banneraya.mangiri@enormous1.com', 'banneraya123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Bryan Vittorio Hapsoro', 'bryan.hapsoro@enormous1.com', 'bryan123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Calvien Aprilio Koe', 'calvien.koe@enormous1.com', 'calvien123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Candice Alexa Lawrence', 'candice.lawrence@enormous1.com', 'candice123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Dayzel Clarence Sukmadja', 'dayzel.sukmadja@enormous1.com', 'dayzel123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Dominick Noel Arianto', 'dominick.arianto@enormous1.com', 'dominick123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Edward Riedel Mercy Rondonuwu', 'edward.rondonuwu@enormous1.com', 'edward123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Eugenia Keirin Febrianta', 'eugenia.febrianta@enormous1.com', 'eugenia123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Florincia Juniar Santoso', 'florincia.santoso@enormous1.com', 'florincia123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Hebert Romualdo Purvance Sitinjak', 'hebert.sitinjak@enormous1.com', 'hebert123', 'SD', '6B', 'Regular');
SELECT temp_add_student('James Chandra', 'james.chandra@enormous1.com', 'james123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Jesslyn Verena Gunawan', 'jesslyn.gunawan@enormous1.com', 'jesslyn123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Katarina Heidy Irawan', 'katarina.irawan@enormous1.com', 'katarina123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Keisha Adrianna', 'keisha.adrianna@enormous1.com', 'keisha123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Letizia Caroline Tandyana', 'letizia.tandyana@enormous1.com', 'letizia123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Maria Irena Anindita', 'maria.anindita@enormous1.com', 'maria123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Matthew Jeremy Djimantoro', 'matthew.djimantoro@enormous1.com', 'matthew123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Mikaela Shalom Panggadewi', 'mikaela.panggadewi@enormous1.com', 'mikaela123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Miuccia Kwok', 'miuccia.kwok@enormous1.com', 'miuccia123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Morgen Louis Go', 'morgen.go@enormous1.com', 'morgen123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Stephanie Christabella Muliate', 'stephanie.muliate@enormous1.com', 'stephanie123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Sylvester Saffron Sunarto', 'sylvester.sunarto@enormous1.com', 'sylvester123', 'SD', '6B', 'Regular');
SELECT temp_add_student('Tricia Allegra Santoso', 'tricia.santoso@enormous1.com', 'tricia123', 'SD', '6B', 'Regular');

-- =====================================================
-- SD KELAS 6C (26 students)
-- =====================================================
SELECT temp_add_student('Adrian Keenanta Tomu', 'adrian.tomu@enormous1.com', 'adrian123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Amadeus Thierry Victory Widjaja', 'amadeus.widjaja@enormous1.com', 'amadeus123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Athanasius Hazael Kurniawan', 'athanasius.kurniawan@enormous1.com', 'athanasius123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Chester Felix Pangoloi Siagian', 'chester.siagian@enormous1.com', 'chester123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Christafiona Patricia Gendhis Ayu W.', 'christafiona.w@enormous1.com', 'christafiona123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Clara Nathania Sumampouw', 'clara.sumampouw@enormous1.com', 'clara123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Djovan Yunus', 'djovan.yunus@enormous1.com', 'djovan123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Emmanuela Diandra Mahardika', 'emmanuela.mahardika@enormous1.com', 'emmanuela123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Federico Jayden Lie', 'federico.lie@enormous1.com', 'federico123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Felicia Adelia Debora Simarmata', 'felicia.simarmata@enormous1.com', 'felicia123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Franciscus Xaverius Nasth Prasetya', 'franciscus.prasetya2@enormous1.com', 'franciscus123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Hello Hoschea Henokh Situmorang', 'hello.situmorang@enormous1.com', 'hello123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Jacyleen Daniella Rusli', 'jacyleen.rusli@enormous1.com', 'jacyleen123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Jevan Raphael Yan', 'jevan.yan@enormous1.com', 'jevan123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Jillian Isabelle', 'jillian.isabelle@enormous1.com', 'jillian123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Kenzou Ardison Tjoa', 'kenzou.tjoa@enormous1.com', 'kenzou123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Louvenia Lukito', 'louvenia.lukito@enormous1.com', 'louvenia123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Maria Felicia Suryono', 'maria.suryono@enormous1.com', 'maria123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Maria Starla Andraya Simatupang', 'maria.simatupang@enormous1.com', 'maria123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Matthew Alexander Rousnalddy', 'matthew.rousnalddy@enormous1.com', 'matthew123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Nicholas Christian Aritonang', 'nicholas.aritonang@enormous1.com', 'nicholas123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Rafael Castellanos Prasetya', 'rafael.prasetya@enormous1.com', 'rafael123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Raphaela Felicia Christabel', 'raphaela.christabel@enormous1.com', 'raphaela123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Sander Klasen Halim', 'sander.halim@enormous1.com', 'sander123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Stephanie Vallerie Chung', 'stephanie.chung@enormous1.com', 'stephanie123', 'SD', '6C', 'Regular');
SELECT temp_add_student('Tissa Pramitha Joe', 'tissa.joe@enormous1.com', 'tissa123', 'SD', '6C', 'Regular');

-- =====================================================
-- SMP KELAS 7A (21 students)
-- =====================================================
SELECT temp_add_student('Benedicta Abigail Paska', 'benedicta.paska@enormous1.com', 'benedicta123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Benedictus Nathan Stiady', 'benedictus.stiady@enormous1.com', 'benedictus123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Brigitta Adelina Cahyawati Edo', 'brigitta.edo@enormous1.com', 'brigitta123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Caesar Matthew Chandyka', 'caesar.chandyka@enormous1.com', 'caesar123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Calista fay langelo', 'calista.langelo@enormous1.com', 'calista123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Christabelle Alodia', 'christabelle.alodia@enormous1.com', 'christabelle123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Dievo Gory Harapan Tobing', 'dievo.tobing@enormous1.com', 'dievo123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Francklin Karsten', 'francklin.karsten@enormous1.com', 'francklin123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Gabrielle Imanuella Armandira', 'gabrielle.armandira@enormous1.com', 'gabrielle123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Gricelda Argentine Malakoi Hurek', 'gricelda.hurek@enormous1.com', 'gricelda123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Hizkia Obed Edom Parhusip', 'hizkia.parhusip@enormous1.com', 'hizkia123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('I Bagus Made Dharma Amurwabhumi', 'bagus.amurwabhumi@enormous1.com', 'bagus123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Jayden Edward Wijayadiyahya', 'jayden.wijayadiyahya@enormous1.com', 'jayden123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Lucas Dhattan', 'lucas.dhattan@enormous1.com', 'lucas123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Mikaela Alysia Ruby Simatupang', 'mikaela.simatupang@enormous1.com', 'mikaela123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Milka Calysta Corinth Tambun', 'milka.tambun@enormous1.com', 'milka123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Putri Arum Kusumaningtyas Muntu', 'putri.muntu@enormous1.com', 'putri123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Rizky Ardiansyah Purnomo', 'rizky.purnomo@enormous1.com', 'rizky123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Roy Dion Keandra', 'roy.keandra@enormous1.com', 'roy123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Vonny Metania', 'vonny.metania@enormous1.com', 'vonny123', 'SMP', 'kelas 7 A', 'Regular');
SELECT temp_add_student('Zefanya Firstania Siregar', 'zefanya.siregar@enormous1.com', 'zefanya123', 'SMP', 'kelas 7 A', 'Regular');

-- =====================================================
-- SMP KELAS 7B (21 students)
-- =====================================================
SELECT temp_add_student('Alvaro Hasiholan Prasetyo', 'alvaro.prasetyo@enormous1.com', 'alvaro123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Andrew Marvello Suwarno', 'andrew.suwarno@enormous1.com', 'andrew123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Angelica Luisa Joshi', 'angelica.joshi@enormous1.com', 'angelica123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Camilio Matyas Tobing', 'camilio.tobing@enormous1.com', 'camilio123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Carissa Elisabeth Soru', 'carissa.soru@enormous1.com', 'carissa123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Chrisanta Alodia', 'chrisanta.alodia@enormous1.com', 'chrisanta123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Evan Richie Dharmawan', 'evan.dharmawan@enormous1.com', 'evan123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Gabriel Leonhard Ekaprasetya', 'gabriel.ekaprasetya@enormous1.com', 'gabriel123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Giselle Theresia Angela boru Sihombing', 'giselle.sihombing@enormous1.com', 'giselle123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Jacob Morgan Hutapea', 'jacob.hutapea@enormous1.com', 'jacob123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Karin Eliana Diansavita Nugraha', 'karin.nugraha@enormous1.com', 'karin123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Kleinegan kurniawan', 'kleinegan.kurniawan@enormous1.com', 'kleinegan123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Kylbie Sharon', 'kylbie.sharon@enormous1.com', 'kylbie123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Laura Amanda Mulyono', 'laura.mulyono@enormous1.com', 'laura123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Marcel Antonio Sudono', 'marcel.sudono@enormous1.com', 'marcel123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Nicholas Owen Immanuel', 'nicholas.immanuel@enormous1.com', 'nicholas123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Nisrina Muria Lamis', 'nisrina.lamis@enormous1.com', 'nisrina123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Rachelle Quinn Hartanto', 'rachelle.hartanto@enormous1.com', 'rachelle123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Steven Alexander', 'steven.alexander@enormous1.com', 'steven123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Valentino Vincentius Setiadharma', 'valentino.setiadharma@enormous1.com', 'valentino123', 'SMP', 'KELAS 7B', 'Regular');
SELECT temp_add_student('Valerilla Darlene Obert', 'valerilla.obert@enormous1.com', 'valerilla123', 'SMP', 'KELAS 7B', 'Regular');

-- =====================================================
-- SMP KELAS 8A (17 students)
-- =====================================================
SELECT temp_add_student('Albertus Raezan Mahendra', 'albertus.mahendra@enormous1.com', 'albertus123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Christopher Darryl', 'christopher.darryl@enormous1.com', 'christopher123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Danu Aditya', 'danu.aditya@enormous1.com', 'danu123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Fabian Simon Simatupang', 'fabian.simatupang@enormous1.com', 'fabian123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Felicia Ardelia', 'felicia.ardelia@enormous1.com', 'felicia123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Felicia Chevonne Maelie', 'felicia.maelie@enormous1.com', 'felicia123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Jose Giventius Tungkir Silalahi', 'jose.silalahi@enormous1.com', 'jose123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Joshua Ethan Lesmana', 'joshua.lesmana@enormous1.com', 'joshua123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Julius Arden Wijaya', 'julius.wijaya@enormous1.com', 'julius123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Leonardo Robinson Samosir', 'leonardo.samosir@enormous1.com', 'leonardo123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Louis Diego Aditya Suyadi', 'louis.suyadi@enormous1.com', 'louis123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Maria Christabel Dwi Sancti', 'maria.sancti@enormous1.com', 'maria123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Ni Kadek Dewi Anindya Pramesthi', 'kadek.pramesthi@enormous1.com', 'kadek123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Nicholas Calvin Yap', 'nicholas.yap@enormous1.com', 'nicholas123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Raizel Brigitta Amabelle', 'raizel.amabelle@enormous1.com', 'raizel123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Victoria Jesslyn Sumarlie', 'victoria.sumarlie@enormous1.com', 'victoria123', 'SMP', 'KELAS 8A', 'Regular');
SELECT temp_add_student('Virginia Basana Mikayla Matondang', 'virginia.matondang@enormous1.com', 'virginia123', 'SMP', 'KELAS 8A', 'Regular');

-- =====================================================
-- SMP KELAS 8B (18 students)
-- =====================================================
SELECT temp_add_student('Abigail Olivia Legowo', 'abigail.legowo@enormous1.com', 'abigail123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Edward Antonius', 'edward.antonius@enormous1.com', 'edward123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Eugenia Roselyn Oeilanna', 'eugenia.oeilanna@enormous1.com', 'eugenia123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Franciscus Xaverius Igasth Prasetya', 'franciscus.prasetya3@enormous1.com', 'franciscus123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Frederick Randall Alciady', 'frederick.alciady@enormous1.com', 'frederick123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Hanna Agnesia Nahampun', 'hanna.nahampun@enormous1.com', 'hanna123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Helerius Darren Mulyono', 'helerius.mulyono@enormous1.com', 'helerius123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Jason Aurelio Fortino', 'jason.fortino@enormous1.com', 'jason123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Jonathan Frederick Tristan', 'jonathan.tristan@enormous1.com', 'jonathan123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Josh Hansen Halim', 'josh.halim@enormous1.com', 'josh123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Lorenzo Lukas Robinson Samosir', 'lorenzo.samosir@enormous1.com', 'lorenzo123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Matthew Fritzie Irawan', 'matthew.irawan@enormous1.com', 'matthew123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Michio Aurelius Winata', 'michio.winata@enormous1.com', 'michio123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Mysha Mayrania', 'mysha.mayrania@enormous1.com', 'mysha123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Nathania Cheryl Hapsoro', 'nathania.hapsoro@enormous1.com', 'nathania123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Raphael Putra Simangunsong', 'raphael.simangunsong@enormous1.com', 'raphael123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Rayindra Hananta Tomu', 'rayindra.tomu@enormous1.com', 'rayindra123', 'SMP', 'KELAS 8B', 'Regular');
SELECT temp_add_student('Vanessa Angelia Sugeng', 'vanessa.sugeng@enormous1.com', 'vanessa123', 'SMP', 'KELAS 8B', 'Regular');

-- =====================================================
-- SMP KELAS 9A (30 students)
-- =====================================================
SELECT temp_add_student('Aleta Celestia', 'aleta.celestia@enormous1.com', 'aleta123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Alexander Farrel Wonoadi', 'alexander.wonoadi@enormous1.com', 'alexander123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Amadeus Joel Permana', 'amadeus.permana@enormous1.com', 'amadeus123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Angelica Regina Putri', 'angelica.putri@enormous1.com', 'angelica123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Bellena Yohanim Sihombing', 'bellena.sihombing@enormous1.com', 'bellena123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Chandra Billion', 'chandra.billion@enormous1.com', 'chandra123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Clarabelle Lysen', 'clarabelle.lysen@enormous1.com', 'clarabelle123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Daniel Lionel', 'daniel.lionel@enormous1.com', 'daniel123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Devanno Emmanuel', 'devanno.emmanuel@enormous1.com', 'devanno123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Devon Mathea Immanuel', 'devon.immanuel@enormous1.com', 'devon123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Elysia Annabelle', 'elysia.annabelle@enormous1.com', 'elysia123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Faith Mikhaya Rondonuwu', 'faith.rondonuwu@enormous1.com', 'faith123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Francisco Theodore Natal Ginting', 'francisco.ginting@enormous1.com', 'francisco123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Fransiskus Jonathan Wilanda Tanamal', 'fransiskus.tanamal@enormous1.com', 'fransiskus123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Galvin Ezra Valentino Pangaribuan', 'galvin.pangaribuan@enormous1.com', 'galvin123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Gherio Fernando Pangestu', 'gherio.pangestu@enormous1.com', 'gherio123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Giselle Heavenly', 'giselle.heavenly@enormous1.com', 'giselle123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Grace Frederica Amanda Manik', 'grace.manik@enormous1.com', 'grace123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Jocelyn Aulia Felicia', 'jocelyn.felicia@enormous1.com', 'jocelyn123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Jordan Halim', 'jordan.halim@enormous1.com', 'jordan123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Kenny Jade Junior', 'kenny.junior@enormous1.com', 'kenny123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Neillon Gouw', 'neillon.gouw@enormous1.com', 'neillon123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Ngit Albert D Minggus Pakass', 'ngit.pakass@enormous1.com', 'ngit123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Nikita Amiko Haryanto', 'nikita.haryanto@enormous1.com', 'nikita123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Sola Gratia Fidelia Candra', 'sola.candra@enormous1.com', 'sola123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Valentino Redy', 'valentino.redy@enormous1.com', 'valentino123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Vienna Hadyanto', 'vienna.hadyanto@enormous1.com', 'vienna123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Winerdy Setiabudi Benjamin', 'winerdy.benjamin@enormous1.com', 'winerdy123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Xena Ruby Setiawan', 'xena.setiawan@enormous1.com', 'xena123', 'SMP', 'KELAS 9A', 'Regular');
SELECT temp_add_student('Yosefhine Valentina Batubara', 'yosefhine.batubara@enormous1.com', 'yosefhine123', 'SMP', 'KELAS 9A', 'Regular');

-- =====================================================
-- Cleanup temporary function
-- =====================================================
DROP FUNCTION IF EXISTS temp_add_student;

-- =====================================================
-- Summary:
-- Total: 415 students
-- SD ABDI SISWA ARIES: 308 students
-- SMP ABDI SISWA ARIES: 107 students
-- =====================================================
