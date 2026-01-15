-- SQL to fix teacher assigned_classes based on CSV

-- Ms. Isabella
-- Current: 1 BILINGUAL (Bilingual), 2 BILINGUAL (Bilingual), 2A, 2B
-- Should be: 1 BILINGUAL (Bilingual), 2 BILINGUAL (Bilingual), 2A (Regular), 2B (Regular)
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '2 BILINGUAL (Bilingual)', '2A (Regular)', '2B (Regular)']::text[] WHERE id = 'ad8068d9-cbdf-4f3d-9e34-8c7ddf1a4f9f';

-- Mr. Babur
-- Current: KELAS 10-1, KELAS 10-2, KELAS 10-3, KELAS 11-1, KELAS 11-2, KELAS 11-3, KELAS 11-4, KELAS 7A, KELAS 7B, KELAS 7C, KELAS 7D, KELAS 8A, KELAS 8B, KELAS 8C, KELAS 8D, KELAS 9A, KELAS 9B, KELAS 9C, KELAS 9D
-- Should be: 10A, 10B, 11A, 11B, 7A, 7B, 8A, 8B, 9A, 9B
UPDATE profiles SET assigned_classes = ARRAY['10A', '10B', '11A', '11B', '7A', '7B', '8A', '8B', '9A', '9B']::text[] WHERE id = 'eb4f7da4-c6b1-47a4-8c74-4cd1688df7b2';

-- Ms Rose
-- Current: 1A, 1B, 2A, 2B, 4A, 4B, KELAS 7B, KELAS 8A, KELAS 8B, kelas 7 A
-- Should be: 1 BILINGUAL (Bilingual), 2 BILINGUAL (Bilingual), 4A (Regular), 4B (Regular), 7A, 7B, 8A, 8B
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '2 BILINGUAL (Bilingual)', '4A (Regular)', '4B (Regular)', '7A', '7B', '8A', '8B']::text[] WHERE id = 'ca4841d8-06b3-4a1e-81b7-9ec56fae7d95';

-- Ms Glarace
-- Current: 7A, 7B, 7C, 7D, 7E, 7F, 7G, 7H, 7I, 8A, 8B, 8C, 8D, 8E, 8F, 8G, 8H, 8I, 9A, 9B, 9C, 9D, 9E, 9F, 9G, 9H
-- Should be: 7A, 7B, 8A, 8B, 9A, 9B
UPDATE profiles SET assigned_classes = ARRAY['7A', '7B', '8A', '8B', '9A', '9B']::text[] WHERE id = '0e12a455-22b4-429d-a6f1-0475c7ea6d9f';

-- Ms Hila
-- Current: 1 BILINGUAL, 1A, 1B, 1C, 2A, 2B, 3A, 3B, 3C, 4A, 4B, 4C, 5A, 5B, 5C, 6A, 6B, 6C, 6D, TK
-- Should be: 1 BILINGUAL (Bilingual), 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B, TK A, TK B
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', 'TK A', 'TK B']::text[] WHERE id = 'ed93e8be-edf9-4579-9864-3efb7d4de15c';

-- Mr. Zed
-- Current: 7A, 7B, 7C, 7D, 8A, 8B, 8C, 8D, 9A, 9B, 9C, X1, X2, X3, XI 1, XI 3, XI2, XII 1, XII 2, XII 3
-- Should be: 10A, 10B, 11A, 11B, 12A, 12B, 7D (Regular), 8A (Regular), 8B (Regular), 8C (Regular), 8D (Regular), 9A (Regular), 9B (Regular), 9C (Regular)
UPDATE profiles SET assigned_classes = ARRAY['10A', '10B', '11A', '11B', '12A', '12B', '7D (Regular)', '8A (Regular)', '8B (Regular)', '8C (Regular)', '8D (Regular)', '9A (Regular)', '9B (Regular)', '9C (Regular)']::text[] WHERE id = '38da49d5-2d10-4b14-9524-0a14474c908c';

-- Ms Jeni
-- Current: KELAS 1 A, KELAS 1 B, KELAS 1 C, KELAS 1 D, KELAS 4 A, KELAS 4B, KELAS 4C, KELAS 4D, KELAS 5A, KELAS 5B, KELAS 5C, KELAS 6A, KELAS 6B, KELAS 6C, KELAS 6D
-- Should be: 1A, 1B, 4A, 4B, 5A, 5B, 6A, 6B
UPDATE profiles SET assigned_classes = ARRAY['1A', '1B', '4A', '4B', '5A', '5B', '6A', '6B']::text[] WHERE id = '629be629-3785-4c05-88dc-a44a80d8a9a7';

-- Mr Mo
-- Current: 5A, 5B, 5C, 5D, KELAS 2A, KELAS 2B, KELAS 2C, KELAS 2D, KELAS 3A, KELAS 3B, KELAS 3C, KELAS 3D, KELAS 4A, KELAS 4B, KELAS 4C, KELAS 4D, KELAS 5A, KELAS 5B, KELAS 5C, KELAS 5D
-- Should be: 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 7A, 7B, 8A, 8B, 9A, 9B
UPDATE profiles SET assigned_classes = ARRAY['2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '7A', '7B', '8A', '8B', '9A', '9B']::text[] WHERE id = '0091b3a4-bd6d-4d7f-8814-5960fe3769ec';

-- Ms Smitha
-- Current: 1 A, 1 B, 1C, 1D, 2 B, 2 C, 2A, 2D, 3A, 3B, 3C, 3D, 4A, 4B, 4C, 4D, 6A, 6B, 6C, 6D, TK BILINGUAL
-- Should be: 1 BILINGUAL (Bilingual), 1A, 1B, 2A, 2B, 3 BILINGUAL (Bilingual), 4A, 4B, 6A, 6B, A BILINGUAL (Bilingual), B BILINGUAL (Bilingual), TK BILINGUAL
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '1A', '1B', '2A', '2B', '3 BILINGUAL (Bilingual)', '4A', '4B', '6A', '6B', 'A BILINGUAL (Bilingual)', 'B BILINGUAL (Bilingual)', 'TK BILINGUAL']::text[] WHERE id = '291e38ed-4de7-4b4f-a8c6-d2507e409e14';

-- Ms Maria
-- Current: 1 A, 1 B, 1C, 1D, 2 B, 2 C, 2A, 2D, 3A, 3B, 3C, 3D, 4A, 4B, 4C, 4D
-- Should be: 1 BILINGUAL (Bilingual), 2 BILINGUAL (Bilingual), 3 BILINGUAL (Bilingual), 3A, 3B, 4 BILINGUAL (Bilingual)
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '2 BILINGUAL (Bilingual)', '3 BILINGUAL (Bilingual)', '3A', '3B', '4 BILINGUAL (Bilingual)']::text[] WHERE id = '5baaa8d6-d604-4e2c-a706-42aea9caaac2';

-- Mr Chris
-- Current: KELAS 2 B, KELAS 2A, KELAS 2C, KELAS 2D, KELAS 3 C, KELAS 3A, KELAS 3B, KELAS 3D, KELAS 4 A, KELAS 4B, KELAS 4C, KELAS 4D, KELAS 5A, KELAS 5B, KELAS 5C, KELAS 6A, KELAS 6B, KELAS 6C, KELAS 6D
-- Should be: 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B
UPDATE profiles SET assigned_classes = ARRAY['2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B']::text[] WHERE id = 'c4bd34b6-1f9a-4c4f-8721-056f85054144';

-- Ms Fercy
-- Current: KELAS 1A, KELAS 2A, KELAS 2B, KELAS 3A, KELAS 3B, KELAS 4A, KELAS 5A, KELAS 6A, KELAS 6B, KELAS 7A, KELAS 8A, KELAS 8B, KELAS 9A, KELAS 9B, TK A, TK B
-- Should be: 1 BILINGUAL (Bilingual), 1A, 1B, 2 BILINGUAL (Bilingual), 2A, 2B, 3 BILINGUAL (Bilingual), 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B, 7A, 7B, 8A, 8B, 9A, 9B, TK A, TK B
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '1A', '1B', '2 BILINGUAL (Bilingual)', '2A', '2B', '3 BILINGUAL (Bilingual)', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', 'TK A', 'TK B']::text[] WHERE id = 'f2684a45-7b1f-4e64-b08e-6729cfdc4c8d';

-- Ms Divine
-- Current: KELAS 1 A, KELAS 1 B, KELAS 1 C, KELAS 1 D, KELAS 4 A, KELAS 4B, KELAS 4C, KELAS 4D, KELAS 5A, KELAS 5B, KELAS 5C, KELAS 6A, KELAS 6B, KELAS 6C, KELAS 6D
-- Should be: 1A, 1B, 4A, 4B, 5A, 5B, 6A, 6B
UPDATE profiles SET assigned_classes = ARRAY['1A', '1B', '4A', '4B', '5A', '5B', '6A', '6B']::text[] WHERE id = 'f57820c3-4620-48d2-86be-7e7e632ca99b';

-- Mr Ron
-- Current: 1 A, 1 B, 1C, 1D, 2 B, 2 C, 2A, 2D, 3A, 3B, 3C, 3D, 4A, 4B, 4C, 4D, 6A, 6B, 6C, 7A, 7B, 7C, 8A, 8B, 8C, 9A, 9B, 9C, 9D
-- Should be: 1 BILINGUAL (Bilingual), 2 BILINGUAL (Bilingual), 3 BILINGUAL (Bilingual), 4 BILINGUAL (Bilingual), 6 BILINGUAL (Bilingual)
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '2 BILINGUAL (Bilingual)', '3 BILINGUAL (Bilingual)', '4 BILINGUAL (Bilingual)', '6 BILINGUAL (Bilingual)']::text[] WHERE id = '9b9187ca-b00d-4950-90b7-c2f27ee72ec1';

-- Mr Gavin
-- Current: 1 A, 1 B, 1C, 1D, 2 B, 2 C, 2A, 2D, 3A, 3B, 3C, 3D, 4A, 4B, 4C, 4D, KELAS 1 A, KELAS 1 C, KELAS 1 D, KELAS 1B, KELAS 6A, KELAS 6B, KELAS 6C, KELAS 6D, TK BILINGUAL
-- Should be: 1 BILINGUAL (Bilingual), 1A, 1B, 2 BILINGUAL (Bilingual), 3 BILINGUAL (Bilingual), 4 BILINGUAL (Bilingual), 6A, 6B, TK BILINGUAL
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '1A', '1B', '2 BILINGUAL (Bilingual)', '3 BILINGUAL (Bilingual)', '4 BILINGUAL (Bilingual)', '6A', '6B', 'TK BILINGUAL']::text[] WHERE id = 'a918df6b-12e8-4e03-84f5-3b94fa565b42';

-- Mr Jim
-- Current: 1A, 1B, 1C, 2A, 2B, 2C, 3A, 3B, 3C, 5A, 5B, 5C
-- Should be: 1A, 1B, 2B (Regular), 2C (Regular), 3A (Regular), 3B (Regular), 3C (Regular), 5A (Regular), 5B (Regular), 5C (Regular)
UPDATE profiles SET assigned_classes = ARRAY['1A', '1B', '2B (Regular)', '2C (Regular)', '3A (Regular)', '3B (Regular)', '3C (Regular)', '5A (Regular)', '5B (Regular)', '5C (Regular)']::text[] WHERE id = 'b6fec186-0eb5-48b4-b211-59952418e0b5';

-- Mr Mat
-- Current: KELAS 1 A, KELAS 1 B, KELAS 1 C, KELAS 2A, KELAS 2B, KELAS 2C, KELAS 3A, KELAS 3B, KELAS 4A, KELAS 4B, KELAS 5A, KELAS 5B, KELAS 6A, KELAS 6B, KELAS 6C, TK A-1, TK A-2, TK B-1, TK B-2
-- Should be: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B, 7A, 7B, 8A, 8B, 9A, 9B, TK A, TK B
UPDATE profiles SET assigned_classes = ARRAY['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', 'TK A', 'TK B']::text[] WHERE id = 'e65d4391-b76f-4f19-9a5c-7902480f93bd';

-- Ms Suma
-- Current: 1A, 1B, 1C, 1D, 2A, 2B, 2C, 3A, 3B, 3C, 4A, 4B, 4C, 5A, 5B, 5C, 6A, 6B, 6C
-- Should be: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B
UPDATE profiles SET assigned_classes = ARRAY['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B']::text[] WHERE id = '4bc8b495-7141-4943-b974-cf0857025b79';

-- Ms Lyn
-- Current: 1A, 1B, 2A, 2B, 3A, 3B, 5A, 5B, 6A, 6B, 6C, KELAS 8A, KELAS 8B, KELAS 9A, TK A-1, TK A-2, TK A2, TK B-1, TK B-2, TK B-3, TK B1, TK B2, TK B3, TK B4, TK-A1
-- Should be: 1 BILINGUAL (Bilingual), 1A (Regular), 1B (Regular), 2 BILINGUAL (Bilingual), 2A (Regular), 2B (Regular), 3A (Regular), 3B (Regular), 5A (Regular), 5B (Regular), 6A (Regular), 6B (Regular), 6C (Regular), 8A, 8B, 9A, 9B, TK A, TK B
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '1A (Regular)', '1B (Regular)', '2 BILINGUAL (Bilingual)', '2A (Regular)', '2B (Regular)', '3A (Regular)', '3B (Regular)', '5A (Regular)', '5B (Regular)', '6A (Regular)', '6B (Regular)', '6C (Regular)', '8A', '8B', '9A', '9B', 'TK A', 'TK B']::text[] WHERE id = '2a5dd696-5fd7-46f7-bce9-8661cad050a8';

-- Mr Aloysha
-- Current: KELAS 7C, KELAS 8A, KELAS 8B, KELAS 9A, KELAS 9B, X CULINARY 1, X CULINARY 2, X DKV 1, X DKV 2, X FASHION, XI CULINARY 1, XI CULINARY 2, XI DKV 1, XI DKV 2, XI FASHION, kelas 7A, kelas 7B
-- Should be: 10A, 10B, 11A, 11B, 7A, 7B, 8A, 8B, 9A, 9B
UPDATE profiles SET assigned_classes = ARRAY['10A', '10B', '11A', '11B', '7A', '7B', '8A', '8B', '9A', '9B']::text[] WHERE id = '98add192-534a-4bf3-b66b-c09bfdd3298d';

-- Mr Ren
-- Current: 1, 1 BILINGUAL, 7A, 7B, 7C
-- Should be: 1 BILINGUAL (Bilingual), 7 BILINGUAL (Bilingual)
UPDATE profiles SET assigned_classes = ARRAY['1 BILINGUAL (Bilingual)', '7 BILINGUAL (Bilingual)']::text[] WHERE id = '42bb8138-2cc1-4630-bf95-8713c996711b';

-- Mr Asib
-- Current: 7A, 7B, 7C, 7D, 8A, 8B, 8C, 8D, 9A, 9B, 9C, 9D, KELAS 10-1, KELAS 10-2, KELAS 11-1, KELAS 11-2, KELAS 12-1, KELAS 12-2, KELAS 8B, KELAS 9A, KELAS 9B, kelas 7 A, kelas 7 B, kelas 8A
-- Should be: 10A, 10B, 11A, 11B, 12A, 12B, 7A, 7B, 8A, 8B, 9A, 9B
UPDATE profiles SET assigned_classes = ARRAY['10A', '10B', '11A', '11B', '12A', '12B', '7A', '7B', '8A', '8B', '9A', '9B']::text[] WHERE id = '644c2ff7-ea2d-4e1a-8d06-a1bb4ee1bef1';

