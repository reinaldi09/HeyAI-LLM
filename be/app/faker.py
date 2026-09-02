from pydantic import BaseModel
from faker import Faker
from datetime import date
import random

from app.schemas import PasienCreate

fake = Faker("id_ID")

def generate_fake_pasien():
    return PasienCreate(
        nama=fake.name(),
        jenis_kelamin=random.choice(["laki-laki", "perempuan"]),
        tempat_lahir=fake.city(),
        tanggal_lahir=fake.date_of_birth(minimum_age=1, maximum_age=90),
        pekerjaan=fake.job(),
        no_hp=fake.phone_number(),
        email=fake.email(),
        alamat=fake.address(),
    )
