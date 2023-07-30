<?php

namespace App\Repository;

use App\Entity\LoanHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LoanHistory>
 *
 * @method LoanHistory|null find($id, $lockMode = null, $lockVersion = null)
 * @method LoanHistory|null findOneBy(array $criteria, array $orderBy = null)
 * @method LoanHistory[]    findAll()
 * @method LoanHistory[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class LoanHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LoanHistory::class);
    }

//    /**
//     * @return LoanHistory[] Returns an array of LoanHistory objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('l')
//            ->andWhere('l.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('l.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?LoanHistory
//    {
//        return $this->createQueryBuilder('l')
//            ->andWhere('l.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
