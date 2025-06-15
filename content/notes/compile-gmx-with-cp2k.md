---
title: Compiling Gromacs with CP2K for QM/MM simulation
description: Recording the process of compiling Gromacs for QM/MM simulation with CP2K
date: 2025-06-15T18:49
update: 2025-06-16T00:08
tags:
  - note/2025/06
  - note/molecular-dynamics
id: note20250615184922
dg-publish: true
maturity: tree
---
> [!quote] Hybrid Quantum-Classical simulations (QM/MM) with CP2K interface
> In a molecular mechanics (MM) force field, the influence of electrons is expressed by empirical parameters that are assigned on the basis of experimental data, or on the basis of results from high-level quantum chemistry calculations. These are valid for the ground state of a given covalent structure, and the MM approximation is usually sufficiently accurate for ground-state processes in which the overall connectivity between the atoms in the system remains unchanged. However, for processes in which the connectivity does change, such as chemical reactions, or processes that involve multiple electronic states, such as photochemical conversions, electrons can no longer be ignored, and a quantum mechanical description is required for at least those parts of the system in which the reaction takes place. One approach to the simulation of chemical reactions in solution, or in enzymes, is to use a combination of quantum mechanics (QM) and molecular mechanics (MM). The reacting parts of the system are treated quantum mechanically, with the remainder being modeled using the force field. The current version of GROMACS provides an interface to the popular Quantum Chemistry package CP2K [^1]

# Preparing CP2K interface for QM part
Integrating the CP2K QM/MM interface into GROMACS will require linking against the libcp2k library, which incorporates CP2K functionality.

> [!Info] Notice
> CP2K version `8.1` or higher and Gromacs version `2022` or higher are requred. Here I used CP2K `2024.1` and Gromacs `2024.2`.

## Dependencies preparation
### OpenMPI
Although CP2K can automatically install OpenMPI, I opted to compile it manually to ensure compatibility with the specific OpenMPI version required by other software.

```bash
wget https://download.open-mpi.org/release/open-mpi/v4.1/openmpi-4.1.1.tar.bz2
tar -xvf openmpi-4.1.1.tar.bz2
cd openmpi-4.1.1/
./configure --prefix=/opt/openmpi411 --disable-builtin-atomics
sudo make -j 12 install
```

Note that the installation directory, such as `/opt/openmpi411`, can be located anywhere you prefer.

After installation, add `openmpi` library into `PATH` by editting `~/.bashrc` :
``` bash ~/.bashrc
export PATH=/opt/openmpi411/bin:$PATH
export LD_LIBRARY_PATH=/opt/openmpi411/lib:$LD_LIBRARY_PATH
```

Note that after each time you edit the `.bashrc` file, don't forget to apply the changes:
```bash
source ~/.bashrc
```

### FFTW
If your CPUs support AVX2, it is recommended to compile the `fftw` library yourself using the `--enable-avx2` option to accelerate the simulation process.

``` bash
wget http://www.fftw.org/fftw-3.3.10.tar.gz
tar -zxf fftw-3.3.10.tar.gz
cd fftw-3.3.10/
./configure --prefix=/opt/fftw3310 --enable-mpi --enable-openmp --enable-sse2 --enable-avx --enable-float --enable-shared --enable-avx2
sudo make -j 12 install
```

Similarly, the installation directory `/opt/fftw3310` can be located anywhere you prefer.

After installation, add `fftw` library into `PATH` by editting `~/.bashrc` :
``` bash ~/.bashrc
export PATH=/opt/fftw3310/bin:$PATH
export LD_LIBRARY_PATH=/opt/fftw3310/lib:$LD_LIBRARY_PATH
```

## Compiling CP2K
Here, I use CP2K version `2024.1`. The components used for compiling CP2K should be compatible with those of Gromacs.

Install CP2K with `toolchain`:
``` bash
cd /path/to/cp2k/
cd tools/toolchain/
./install_cp2k_toolchain.sh \
--with-libxsmm=install \
--with-elpa=install \
--with-libxc=install \
--with-libint=install \
--with-gsl=no \
--with-libvdwxc=no \
--with-spglib=no \
--with-hdf5=no \
--with-spfft=no \
--with-cosma=no \
--with-libvori=no \
--with-sirius=no \
--with-scalapack=install \
--with-openblas=install \
--with-fftw=/opt/fftw3310 \
--with-openmpi=system \
--with-plumed=install
```

This process will take tens of minutes. You can also utilize previously installed components in your system, such as by specifying `--with-openblas=system`.

Note that the location of FFTW (/opt/fftw3310, or other location you specified when installing FFTW) must be specified; otherwise, errors will occur during the compilation of Gromacs.

After this process, all components installed by `toolchain` can be found in `/path/to/cp2k/tools/toolchain/install/`.

Then we can complie CP2K:
``` bash
cp install/arch/* ../../arch/
source install/setup
make -j 12 ARCH=local VERSION="ssmp psmp"
make -j 12 ARCH=local VERSION="ssmp psmp" libcp2k
```

If the compilation succeeds, you should find the executable files in `/path/to/cp2k/exe/`, and the `libcp2k.a` file in `/path/to/cp2k/lib/psmp/`.

Add CP2K into `PATH` by editting `~/.bashrc`:
```bash ~/.bashrc
source /path/to/cp2k/tools/toolchain/install/setup
export PATH=$PATH:/path/to/cp2k/exe/local
export CP2K_DATA_DIR=/path/to/cp2k/data
```

# Compiling Gromacs
Here, I use Gromacs version `2024.2`. The compilation process for Gromacs is much simpler than that for CP2K, as most of the dependencies have already been prepared during the CP2K compilation.

``` bash
cd /path/to/gromacs
mkdir build
cd build\
cmake .. -DCMAKE_PREFIX_PATH=/opt/fftw3310 \
-DCMAKE_INSTALL_PREFIX=/path/to/gromacs/ \
-DBUILD_SHARED_LIBS=OFF \
-DGMXAPI=OFF \
-DGMX_INSTALL_NBLIB_API=OFF \
-DGMX_DOUBLE=ON \
-DGMX_MPI=ON \
-DGMX_FFT_LIBRARY=fftw3 \
-DGMX_BLAS_USER=/path/to/cp2k/tools/toolchain/install/openblas-0.3.25/lib/libopenblas.so \
-DGMX_LAPACK_USER=/path/to/cp2k/tools/toolchain/install/openblas-0.3.25/lib/libopenblas.so \
-DGMX_CP2K=ON \
-DCP2K_DIR=/path/to/cp2k/lib/local/psmp \
-DGMX_DEFAULT_SUFFIX=OFF \
-DCP2K_LINKER_FLAGS="..." \
-DMPI_C_COMPILER=/opt/openmpi411/bin/mpicc \
-DMPI_C_COMPILER=/opt/openmpi411/bin/mpicxx \
-DMPI_Fortran_COMPILER=/opt/openmpi411/bin/mpif90
```

`-DGMX_BLAS_USER` and `-DGMX_LAPACK_USER` options specify the library for `BLAS` and `LAPACK`, which are provided by `libopenblas`.

`-DCP2K_LINKER_FLAGS` option specifies libraries which should be compatible with those used for the compilation of CP2K. Specifically, you can find them in the `/path/to/cp2k/tools/toolchain/install/arch/local.psmp` file:
```
LDFLAGS     =  $(FCFLAGS) ...
LIBS        = ...
```

`-DMPI_C_COMPILER`, `-DMPI_C_COMPILER` and `-DMPI_Fortran_COMPILER` specify comilers used for compilation. You should specify them if there're multiple compilers for MPI compiling in your machine.

Compile Gromacs:
```bash
make -j 12
sudo make -j 12 install
```

You should find the executable files in `/path/to/gromacs/bin` if the compilation succeeds.

Add Gromacs into `~/.bashrc`:
```bash
source /path/to/gromacs/bin/GMXRC
export PATH=$PATH:/path/to/gromacs/bin
```

```poetry
Just enjoy QM/MM simulation with Gromacs and CP2K!
```

[^1]: See Gromacs Manual "[Hybrid Quantum-Classical simulations (QM/MM) with CP2K interface](https://manual.gromacs.org/current/reference-manual/special/qmmm.html)"