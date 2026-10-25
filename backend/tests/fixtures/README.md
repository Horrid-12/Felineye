# Identification test fixtures

Small, resized photographs used only by the real-provider regression tests. They
are not part of the production catalog and are not used to train or tune a model.

All source images are from Wikimedia Commons and remain under their original
licenses. They are redistributed here at reduced resolution for testing.

| File | Source | Author | License |
| --- | --- | --- | --- |
| `tiger.jpg` | [Bengal tiger (Panthera tigris tigris) female 3 crop.jpg](https://commons.wikimedia.org/wiki/File:Bengal_tiger_(Panthera_tigris_tigris)_female_3_crop.jpg) | Charles J. Sharp | CC BY-SA 4.0 |
| `ragdoll.jpg` | [Ragdoll from Gatil Ragbelas.jpg](https://commons.wikimedia.org/wiki/File:Ragdoll_from_Gatil_Ragbelas.jpg) | Simone Johnsson | CC BY-SA 2.0 |
| `chihuahua.jpg` | [Chihuahua1 bvdb.jpg](https://commons.wikimedia.org/wiki/File:Chihuahua1_bvdb.jpg) | Bonnie van den Born | CC BY-SA 3.0 |
| `crocodile.jpg` | [NileCrocodile.jpg](https://commons.wikimedia.org/wiki/File:NileCrocodile.jpg) | Dewet | CC BY-SA 2.0 |
| `serval.jpg` | [Serval (Leptailurus serval), parque nacional de Tarangire, Tanzania, 2024-05-25, DD 54.jpg](https://commons.wikimedia.org/wiki/File:Serval_(Leptailurus_serval),_parque_nacional_de_Tarangire,_Tanzania,_2024-05-25,_DD_54.jpg) | Diego Delso | CC BY-SA 4.0 |
| `chihuahua_with_crocodile.jpg` | Composite of `chihuahua.jpg` and `crocodile.jpg` | Composite for this test suite | CC BY-SA (inherits above) |

The composite is a deliberately adversarial non-feline image: a Chihuahua and a
crocodilian in one frame. It must never produce a serval or other wildcat
identification.
