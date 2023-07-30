<?php

namespace App\Service;

use App\Entity\LoanHistory;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class LoanCalculatorService
{
    /**
     * @var float
     */
    private float $amount;

    /**
     * @var int
     */
    private int $duration;

    /**
     * @var float
     */
    private float $interestRate;

    /**
     * @var array
     */
    private array $monthlyEntries;

    /**
     * @var array
     */
    private array $totals;

    /**
     * @var EntityManagerInterface
     */
    private EntityManagerInterface $entityManager;

    /**
     * @var LoggerInterface
     */
    private LoggerInterface $logger;

    public function __construct(float $amount, int $duration, float $interestRate, EntityManagerInterface $entityManager, LoggerInterface $logger)
    {
        $this->amount = $amount;
        $this->duration = $duration;
        $this->interestRate = $interestRate;
        $this->entityManager = $entityManager;
    }

    public function getMonthlyEntries(): array
    {
        return $this->monthlyEntries;
    }

    public function getTotals(): array
    {
        return $this->totals;
    }

    public function calculate(): void
    {
        $this->monthlyEntries = [];
        $this->totals = [];

        $this->generateLoanData();

        // Save loan request to database. If something goes wrong, log error to not disrupt user experience
        try {
            $this->saveLoanRequestToDatabase();
        } catch (\Exception $e) {
            // Log error
            $this->logger->error($e->getMessage());
        }

    }

    private function generateLoanData(): void
    {
        $this->amount = round($this->amount, 2);
        $monthlyInterestRate = $this->interestRate / 100 / 12;
        $numberOfPayments = $this->duration;
        $compoundedInterestRate = pow((1 + $monthlyInterestRate), $numberOfPayments);
        $interestMultiplier = ($monthlyInterestRate * $compoundedInterestRate) / ($compoundedInterestRate - 1);
        $monthlyPayment = round($this->amount * $interestMultiplier, 2);
        $totalInterest = $monthlyPayment * $numberOfPayments - $this->amount;
        $totalPayment = $monthlyPayment * $numberOfPayments;
        $totalPrincipal = $this->amount;
        $balance = $this->amount;

        for ($month = 0; $month < $numberOfPayments; $month++) {
            $interest = $balance * $monthlyInterestRate;
            $principal = $monthlyPayment - $interest;

            if ($month === $numberOfPayments - 1) {
                $roundingError = $balance - $principal;
                $principal += $roundingError;
                $monthlyPayment += $roundingError;
                $totalInterest += $roundingError;
                $totalPayment += $roundingError;

                $balance = abs($balance - $principal);
            } else {
                $balance -= $principal;
            }

            $this->monthlyEntries[] = [
                'month' => $month + 1,
                'balance' =>  number_format($balance, 2, '.', ''),
                'principal' =>  number_format($principal, 2, '.', ''),
                'interest' =>  number_format($interest, 2, '.', ''),
                'payment' => number_format($monthlyPayment, 2, '.', ''),
            ];
        }

        $this->totals = [
            'totalPrincipal' => round($totalPrincipal, 2),
            'totalInterest' => round($totalInterest,2),
            'totalPayment' => round($totalPayment, 2)
        ];
    }

    private function saveLoanRequestToDatabase(): void
    {
        $loanHistory = new LoanHistory();
        $loanHistory->setAmount($this->amount);
        $loanHistory->setProfit($this->totals['totalInterest']);
        $loanHistory->setUserIp($this->getUserIp());
        $loanHistory->setDate(new \DateTime());

        $this->entityManager->persist($loanHistory);
        $this->entityManager->flush();
    }

    private function getUserIp(): string
    {
        return $_SERVER['REMOTE_ADDR'];
    }
}
